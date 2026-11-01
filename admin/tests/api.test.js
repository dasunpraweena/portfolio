import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdminApi } from '../src/lib/api.js';
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
const client = options => createAdminApi('http://localhost:5432', { getToken: async () => 'test-access', ...options });

test('unwraps records, authorizes each request, and never sends browser cookies', async () => {
  let token = 'test-access';
  const api = client({ getToken: async () => token, fetchImpl: async (url, options) => {
    assert.equal(url, 'http://localhost:5432/api/admin/profile');
    assert.equal(options.headers.Authorization === 'Bearer ' + token, true);
    assert.equal(options.credentials, 'omit');
    return json({ data: { name: 'Owner' } });
  } });
  assert.deepEqual(await api.read('profile'), { name: 'Owner' });
  token = 'refreshed-test-access';
  await api.read('profile');
});
test('loads all admin collection pages instead of dropping records beyond page one', async () => {
  const api = client({ fetchImpl: async url => { const page = Number(new URL(url).searchParams.get('page')); return json({ data: page === 1 ? [{ id: 'first' }] : [{ id: 'second' }], meta: { page, limit: 100, total: 2 } }); } });
  assert.deepEqual(await api.all('skills'), [{ id: 'first' }, { id: 'second' }]);
});
test('rejects incomplete pagination instead of returning a false empty list', async () => {
  const api = client({ fetchImpl: async () => json({ data: [], meta: { page: 1, total: 2 } }) });
  await assert.rejects(api.all('projects'), /incomplete/);
});
test('refreshes once after 401 and retries only the rejected request', async () => {
  let calls = 0, refreshes = 0, unauthorized = 0;
  const api = client({ refreshToken: async () => { refreshes++; return 'test-refreshed'; }, onUnauthorized: () => unauthorized++, fetchImpl: async () => ++calls === 1 ? json({ error: { message: 'Expired' } }, 401) : json({ data: { id: 'owner' } }) });
  await api.read('me'); assert.equal(calls, 2); assert.equal(refreshes, 1); assert.equal(unauthorized, 0);
});
test('terminates repeated unauthorized responses and informs the auth gate', async () => {
  let calls = 0, unauthorized = 0;
  const api = client({ refreshToken: async () => 'test-retry', onUnauthorized: () => unauthorized++, fetchImpl: async () => { calls++; return json({ error: { message: 'Sign in again' } }, 401); } });
  await assert.rejects(api.read('me'), error => error.status === 401);
  assert.equal(calls, 2); assert.equal(unauthorized, 1);
});
test('handles missing tokens without making a request and gates 403 responses', async () => {
  let denied = 0;
  await assert.rejects(client({ getToken: async () => null, fetchImpl: () => assert.fail('Unauthenticated network call') }).read('me'), error => error.status === 401);
  await assert.rejects(client({ onDenied: () => denied++, fetchImpl: async () => json({ error: { message: 'Denied' } }, 403) }).read('me'), error => error.status === 403);
  assert.equal(denied, 1);
});
test('does not repeat potentially successful writes on network/server failure', async () => {
  let calls = 0;
  const api = client({ fetchImpl: async () => { calls++; throw new TypeError('Network failure'); } });
  await assert.rejects(api.save('projects', null, {}), /could not be reached/);
  assert.equal(calls, 1);
});
test('reloads saved records and distinguishes reload failure from write failure', async () => {
  const methods = [];
  const api = client({ fetchImpl: async (url, options) => { methods.push(options.method); if (options.method === 'POST') return json({ data: { id: 'new-record' } }, 201); return json({ error: { message: 'Unavailable' } }, 503); } });
  await assert.rejects(api.save('projects', null, { status: 'DRAFT' }), error => error.writeSucceeded && error.savedId === 'new-record');
  assert.deepEqual(methods, ['POST', 'GET']);
});
test('uses documented publication route, multipart upload, and 204 deletion', async () => {
  const calls = [];
  const api = client({ fetchImpl: async (url, options) => { calls.push({ path: new URL(url).pathname, ...options }); return options.method === 'DELETE' ? new Response(null, { status: 204 }) : json({ data: { id: 'asset' } }); } });
  await api.publish('project', 'PUBLISHED');
  await api.upload(new File(['fake image test bytes'], 'test.png', { type: 'image/png' }), 'IMAGE');
  await api.remove('projects', 'project');
  assert.equal(calls[0].path, '/api/admin/projects/project/publication');
  assert.deepEqual(JSON.parse(calls[0].body), { status: 'PUBLISHED' });
  assert.equal(calls[1].path, '/api/admin/uploads/image');
  assert.ok(calls[1].body instanceof FormData); assert.equal(calls[1].headers['Content-Type'], undefined);
  assert.equal(calls[2].method, 'DELETE');
});
test('validates the API origin and reads private previews as authenticated blobs', async () => {
  for (const base of ['https://user:password@example.com', 'https://example.com/path', 'invalid']) {
    await assert.rejects(createAdminApi(base, { getToken: async () => 'test' }).read('me'), error => error.code === 'CONFIGURATION');
  }
  const api = client({ fetchImpl: async () => new Response('image bytes', { headers: { 'Content-Type': 'image/png' } }) });
  assert.equal((await api.file('asset')).type, 'image/png');
});
