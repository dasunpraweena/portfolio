export class ApiError extends Error {
  constructor(message, { status = 0, details = [], code = 'API_ERROR' } = {}) { super(message); this.name = 'ApiError'; Object.assign(this, { status, details, code }); }
}
export function createAdminApi(base, { getToken, refreshToken, onUnauthorized = () => {}, onDenied = () => {}, fetchImpl = (...args) => fetch(...args), timeout = 25000 } = {}) {
  let origin;
  try { const url = new URL(base); if (['http:', 'https:'].includes(url.protocol) && !url.username && !url.password && url.pathname === '/' && !url.search && !url.hash) origin = url.origin; } catch { /* Report through the UI on first request. */ }
  async function request(path, { method = 'GET', body, signal, blob = false, refreshed = false } = {}) {
    if (!origin) throw new ApiError('Configure the public API address in admin/.env.local.', { code: 'CONFIGURATION' });
    const token = await getToken();
    if (!token) { onUnauthorized(); throw new ApiError('Your session has expired. Sign in again.', { status: 401 }); }
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal?.aborted) abort(); else signal?.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(abort, timeout);
    try {
      const form = typeof FormData !== 'undefined' && body instanceof FormData;
      const response = await fetchImpl(origin + '/api/admin' + path, { method, signal: controller.signal, credentials: 'omit', cache: 'no-store',
        headers: { Accept: blob ? '*/*' : 'application/json', Authorization: 'Bearer ' + token, ...(body !== undefined && !form ? { 'Content-Type': 'application/json' } : {}) },
        ...(body !== undefined ? { body: form ? body : JSON.stringify(body) } : {}),
      });
      if (response.status === 401 && !refreshed && refreshToken) {
        const fresh = await refreshToken();
        if (fresh) return request(path, { method, body, signal, blob, refreshed: true });
      }
      if (response.status === 401) onUnauthorized();
      if (response.status === 403) onDenied();
      if (response.status === 204) return { data: null };
      if (blob && response.ok) return response.blob();
      let result;
      try { result = await response.json(); } catch { throw new ApiError('The service returned an unreadable response. Retry the request.', { status: response.status }); }
      if (!response.ok) throw new ApiError(result.error?.message || 'The request could not be completed.', { status: response.status, details: result.error?.details || [], code: result.error?.code });
      if (!Object.hasOwn(result, 'data')) throw new ApiError('The service returned an unexpected response.');
      return result;
    } catch (error) {
      if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
      if (error instanceof ApiError) throw error;
      throw new ApiError('The portfolio service could not be reached. Please retry.');
    } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
  }
  const read = async (resource, id, options) => (await request('/' + resource + (id ? '/' + encodeURIComponent(id) : ''), options)).data;
  const list = (resource, query = {}, options = {}) => request('/' + resource + '?' + new URLSearchParams({ page: '1', limit: '100', ...Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined)) }), options);
  return {
    origin, request, read, list,
    async all(resource, options) {
      const rows = []; let page = 1;
      while (true) {
        const result = await list(resource, { page: String(page), limit: '100' }, options);
        if (!Array.isArray(result.data) || !Number.isInteger(result.meta?.total) || result.meta.page !== page) throw new ApiError('The collection could not be read.');
        rows.push(...result.data);
        if (rows.length >= result.meta.total) return rows;
        if (!result.data.length || page++ >= 10000) throw new ApiError('The collection is incomplete. Retry loading it.');
      }
    },
    async save(resource, id, data, singleton = false) {
      const result = await request('/' + resource + (id && !singleton ? '/' + id : ''), { method: singleton ? 'PUT' : id ? 'PATCH' : 'POST', body: data });
      try { return await read(resource, singleton ? null : result.data.id); }
      catch { throw Object.assign(new ApiError('The change was accepted, but the saved record could not be reloaded. Retry loading it.'), { savedId: result.data?.id, writeSucceeded: true }); }
    },
    patch: async (resource, id, data) => (await request('/' + resource + (id ? '/' + id : ''), { method: 'PATCH', body: data })).data,
    remove: (resource, id) => request('/' + resource + (id ? '/' + id : ''), { method: 'DELETE' }),
    async order(resource, rows) {
      for (let offset = 0; offset < rows.length; offset += 100) await request('/' + resource + '/order', { method: 'PATCH', body: { items: rows.slice(offset, offset + 100).map((row, index) => ({ id: row.id, sortOrder: offset + index })) } });
    },
    publish: (id, status) => request('/projects/' + id + '/publication', { method: 'PATCH', body: { status } }),
    async upload(file, kind) { const body = new FormData(); body.append('file', file); return (await request('/uploads/' + (kind === 'PDF' ? 'pdf' : 'image'), { method: 'POST', body })).data; },
    file: (id, options = {}) => request('/assets/' + id + '/file', { ...options, blob: true }),
    reconcile: () => request('/assets/reconcile', { method: 'POST' }),
  };
}
