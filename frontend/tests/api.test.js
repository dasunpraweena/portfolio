import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createApiClient } from '../src/api/client.js';
const portfolio = JSON.parse(fs.readFileSync(new URL('./fixtures/portfolio.json', import.meta.url), 'utf8'));
const reply = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });
const project = slug => ({ slug, name: slug, tech: ['Concept'], features: [], technologies: [], screenshots: [] });

test('unwraps portfolio data and adapts skill, learning, milestone, and profile fields', async () => {
  const api = createApiClient('http://localhost:5432', { fetchImpl: async () => reply({ data: portfolio }) });
  const result = await api.getPortfolio();
  assert.equal(result.profile.name, portfolio.profile.name);
  assert.deepEqual(result.skillCategories[0].items, ['Java', 'C', 'C#', 'JavaScript']);
  assert.equal(result.learningTopics[0].id, 'linux');
  assert.equal(result.milestones[0].titleLines.length, 2);
  assert.equal(result.profile.cv.url, null);
});
test('treats an empty published collection as success rather than using local outlines', async () => {
  const api = createApiClient('http://localhost:5432', { fetchImpl: async () => reply({ data: [], meta: { page: 1, limit: 100, total: 0 } }) });
  assert.deepEqual(await api.getProjects(), { projects: [], total: 0 });
});
test('fetches every project page and sends the selected category', async () => {
  const calls = [];
  const api = createApiClient('http://localhost:5432', { fetchImpl: async address => {
    const url = new URL(address); calls.push(url);
    const page = Number(url.searchParams.get('page'));
    return reply({ data: Array.from({ length: page === 3 ? 5 : 100 }, (_, index) => project(`project-${(page - 1) * 100 + index}`)), meta: { page, limit: 100, total: 205 } });
  } });
  const result = await api.getProjects({ category: 'web' });
  assert.equal(result.projects.length, 205); assert.equal(calls.length, 3);
  assert.ok(calls.every(url => url.searchParams.get('category') === 'web'));
  assert.equal(result.projects[204].id, 'project-204');
});
test('rejects incomplete pagination instead of silently dropping projects', async () => {
  const api = createApiClient('http://localhost:5432', { fetchImpl: async () => reply({ data: [], meta: { page: 1, limit: 100, total: 2 } }) });
  await assert.rejects(() => api.getProjects(), error => error.code === 'INVALID_PAGINATION');
});
test('loads individual project details from the documented slug endpoint', async () => {
  let address;
  const api = createApiClient('http://localhost:5432', { fetchImpl: async url => { address = url; return reply({ data: project('case-study') }); } });
  const result = await api.getProject('case-study');
  assert.equal(address, 'http://localhost:5432/api/projects/case-study'); assert.equal(result.id, 'case-study');
});
test('resolves relative image, CV, and certificate URLs against the API origin', async () => {
  const data = structuredClone(portfolio);
  data.profile.photo = { url: '/api/assets/photo' }; data.settings.cv = { url: '/api/assets/cv', kind: 'PDF' };
  data.certificates = [{ slug: 'certificate', file: { url: '/api/assets/certificate' } }];
  const api = createApiClient('http://localhost:5432', { fetchImpl: async () => reply({ data }) });
  const result = await api.getPortfolio();
  assert.equal(result.profile.photo.url, 'http://localhost:5432/api/assets/photo');
  assert.equal(result.profile.cv.url, 'http://localhost:5432/api/assets/cv');
  assert.equal(result.certificates[0].file.url, 'http://localhost:5432/api/assets/certificate');
  assert.equal(api.resolveUrl('javascript:alert(1)'), null);
});
test('preserves multiple screenshot captions and illustrative labels', async () => {
  const api = createApiClient('http://localhost:5432', { fetchImpl: async () => reply({ data: { ...project('screenshots'), screenshots: [{ url: '/api/assets/a', illustrative: true, caption: 'Concept' }, { url: '/api/assets/b', illustrative: false, caption: 'Actual screen' }] } }) });
  const result = await api.getProject('screenshots');
  assert.equal(result.screenshots[0].url, 'http://localhost:5432/api/assets/a');
  assert.equal(result.screenshots[0].illustrative, true); assert.equal(result.screenshots[1].caption, 'Actual screen');
});
test('sends only a JSON message request with no credentials and requires confirmed acceptance', async () => {
  let request;
  const values = { name: 'Visitor', email: 'visitor@example.com', subject: 'Question', message: 'Hello 👋 & C#' };
  const api = createApiClient('http://localhost:5432', { fetchImpl: async (url, options) => { request = { url, ...options }; return reply({ data: { accepted: true } }, 201); } });
  await api.sendMessage(values);
  assert.equal(request.url, 'http://localhost:5432/api/messages'); assert.equal(request.method, 'POST');
  assert.deepEqual(JSON.parse(request.body), values); assert.equal(request.credentials, 'omit'); assert.equal(request.headers.Authorization, undefined);
  const unconfirmed = createApiClient('http://localhost:5432', { fetchImpl: async () => reply({ data: { accepted: false } }) });
  await assert.rejects(() => unconfirmed.sendMessage(values), error => error.code === 'SAVE_NOT_CONFIRMED');
});
test('preserves HTTP validation and rate-limit details without reporting a save', async () => {
  const api = createApiClient('http://localhost:5432', { fetchImpl: async () => reply({ error: { code: 'MESSAGE_RATE_LIMITED', message: 'Please try later.' } }, 429, { 'retry-after': '180' }) });
  await assert.rejects(() => api.sendMessage({}), error => error.status === 429 && error.retryAfter === 180);
  const invalid = createApiClient('http://localhost:5432', { fetchImpl: async () => reply({ error: { code: 'VALIDATION_ERROR', message: 'Check fields', details: [{ field: 'email', message: 'Invalid email' }] } }, 422) });
  await assert.rejects(() => invalid.sendMessage({}), error => error.details[0].field === 'email');
});
test('request failures reject explicitly and never substitute portfolio content', async () => {
  for (const fetchImpl of [async () => { throw new TypeError('Failed to fetch'); }, async () => reply({ error: { message: 'Unavailable' } }, 503), async () => reply({ success: true })]) {
    const api = createApiClient('http://localhost:5432', { fetchImpl });
    await assert.rejects(() => api.getPortfolio());
  }
});
test('missing API configuration produces an actionable error before any request', async () => {
  let requested = false;
  const api = createApiClient('', { fetchImpl: async () => { requested = true; } });
  await assert.rejects(() => api.getPortfolio(), error => error.code === 'API_CONFIGURATION'); assert.equal(requested, false);
});
test('timeouts and explicit cancellation terminate pending requests', async () => {
  const fetchImpl = (url, { signal }) => new Promise((resolve, reject) => { if (signal.aborted) reject(new DOMException('Aborted', 'AbortError')); else signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))); });
  const api = createApiClient('http://localhost:5432', { fetchImpl, timeoutMs: 10 });
  await assert.rejects(() => api.getPortfolio(), error => error.code === 'TIMEOUT');
  const controller = new AbortController(); controller.abort();
  await assert.rejects(() => api.getPortfolio({ signal: controller.signal }), error => error.name === 'AbortError');
});
