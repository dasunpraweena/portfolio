import { mapPortfolio, mapProject } from './adapters.js';

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'API_ERROR', details = [], retryAfter = null } = {}) {
    super(message); this.name = 'ApiError'; Object.assign(this, { status, code, details, retryAfter });
  }
}

export function createApiClient(baseUrl, { fetchImpl = (...args) => fetch(...args), timeoutMs = 15000 } = {}) {
  let origin;
  try {
    const parsed = new URL(baseUrl);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/') throw new Error();
    origin = parsed.origin;
  } catch { /* A missing setting becomes a visible, retryable configuration error. */ }
  const configuredOrigin = () => {
    if (!origin) throw new ApiError('The portfolio API address is not configured. Please try again later.', { code: 'API_CONFIGURATION' });
    return origin;
  };
  const resolveUrl = value => {
    if (typeof value !== 'string' || !value.trim()) return null;
    try { const url = new URL(value, configuredOrigin()); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : null; } catch { return null; }
  };
  async function request(path, { method = 'GET', body, signal, blob = false } = {}) {
    const url = new URL(path, configuredOrigin());
    const controller = new AbortController();
    const abort = () => controller.abort(signal?.reason);
    if (signal?.aborted) abort(); else signal?.addEventListener('abort', abort, { once: true });
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
    try {
      const response = await fetchImpl(url.href, { method, credentials: 'omit', cache: 'no-store', signal: controller.signal,
        headers: { Accept: blob ? '*/*' : 'application/json', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
      if (blob && response.ok) return response.blob();
      let envelope;
      try { envelope = await response.json(); } catch { throw new ApiError('The portfolio service returned an unreadable response. Please retry.', { status: response.status, code: 'INVALID_RESPONSE' }); }
      if (!response.ok) {
        const retryAfter = Number(response.headers.get('retry-after')) || null;
        throw new ApiError(envelope?.error?.message || 'The request could not be completed. Please retry.', { status: response.status, code: envelope?.error?.code || 'HTTP_ERROR', details: envelope?.error?.details || [], retryAfter });
      }
      if (!envelope || !Object.hasOwn(envelope, 'data')) throw new ApiError('The portfolio service returned an unexpected response. Please retry.', { code: 'INVALID_RESPONSE' });
      return envelope;
    } catch (error) {
      if (signal?.aborted) throw new DOMException('Request cancelled', 'AbortError');
      if (error instanceof ApiError) throw error;
      throw new ApiError(timedOut ? 'The portfolio service took too long to respond. Please retry.' : 'The portfolio service could not be reached. Please retry.', { code: timedOut ? 'TIMEOUT' : 'NETWORK_ERROR' });
    } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
  }
  return {
    origin, resolveUrl, request,
    async getPortfolio({ signal } = {}) { return mapPortfolio((await request('/api/portfolio', { signal })).data, resolveUrl); },
    async getProjects({ category = 'all', signal } = {}) {
      const projects = []; let page = 1;
      while (true) {
        const query = new URLSearchParams({ category, page: String(page), limit: '100' });
        const result = await request('/api/projects?' + query, { signal });
        if (!Array.isArray(result.data) || !Number.isInteger(result.meta?.total) || result.meta.total < 0 || result.meta.page !== page || !Number.isInteger(result.meta.limit) || result.meta.limit < 1) throw new ApiError('The project collection could not be read. Please retry.', { code: 'INVALID_PAGINATION' });
        projects.push(...result.data.map(project => mapProject(project, resolveUrl)));
        if (projects.length >= result.meta.total) return { projects, total: result.meta.total };
        if (!result.data.length || page >= 10000) throw new ApiError('The project collection is incomplete. Please retry.', { code: 'INVALID_PAGINATION' });
        page++;
      }
    },
    async getProject(slug, { signal } = {}) { return mapProject((await request('/api/projects/' + encodeURIComponent(slug), { signal })).data, resolveUrl); },
    async sendMessage(values, { signal } = {}) {
      const result = await request('/api/messages', { method: 'POST', body: values, signal });
      if (result.data?.accepted !== true) throw new ApiError('The service did not confirm that your message was saved. Please retry.', { code: 'SAVE_NOT_CONFIRMED' });
      return result.data;
    },
    async getFile(url, { signal } = {}) {
      const resolved = resolveUrl(url);
      if (!resolved) throw new ApiError('This file is not available.', { code: 'INVALID_ASSET_URL' });
      return request(resolved, { signal, blob: true });
    },
  };
}

export const api = createApiClient(import.meta.env?.VITE_API_BASE_URL);
