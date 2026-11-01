import { expect } from '@playwright/test';
export const ownerId = '00000000-0000-4000-8000-000000000001';
export const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const jwt = label => [Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'), Buffer.from(JSON.stringify({ sub: ownerId, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600, label })).toString('base64url'), 'test-signature'].join('.');
const user = { id: ownerId, email: 'owner@example.test', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, identities: [], created_at: '2026-01-01T00:00:00Z' };
const session = label => ({ access_token: jwt(label), refresh_token: 'test-refresh-only', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: 'bearer', user });
const now = '2026-11-01T12:00:00Z';
export const project = { id: id(10), name: 'Campus project', slug: 'campus-project', type: 'Web platform', category: 'WEB', short: 'A student project.', tags: ['Academic'], visual: 'market', workKind: 'ACADEMIC', verified: false, implementationStatus: null, problem: 'A real problem.', solution: 'A proposed solution.', features: ['First feature'], contribution: null, lessons: null, demoUrl: null, repositoryUrl: null, featured: false, status: 'DRAFT', sortOrder: 0, technologies: [], screenshots: [], updatedAt: now };
export async function mockWorkspace(page, { signedIn = true, denied = false, delayMe = 0 } = {}) {
  let authSession = session('initial');
  const state = { writes: [], reads: [], authCalls: [], badAuthorization: 0, failedReads: new Set(), failedWrites: new Set(), failRecordReload: false, expire: false, refreshFails: false, meReady: false, prematureReads: 0 };
  state.records = {
    projects: [structuredClone(project)], technologies: [{ id: id(20), name: 'React' }],
    'skill-categories': [{ id: id(30), slug: 'development', name: 'Development', icon: 'code', status: 'PUBLISHED', sortOrder: 0 }],
    skills: [{ id: id(31), categoryId: id(30), name: 'JavaScript', status: 'PUBLISHED', sortOrder: 0 }],
    education: [], experience: [], certificates: [], 'learning-topics': [], milestones: [], 'social-links': [], assets: [],
    messages: [{ id: id(40), name: 'Visitor', email: 'visitor@example.test', subject: 'A collaboration', message: 'Let us build something useful.', readAt: null, createdAt: now }],
    profile: { id: 'main', name: 'Portfolio Owner', email: 'owner@example.test', headline: 'Software engineering student', heroTitle: ['Building useful things.'], introduction: 'An actual introduction for a test fixture.', aboutTitle: ['About me'], about: ['A first paragraph.'], values: ['Curiosity'], location: 'Sri Lanka', availability: 'Open to collaboration', status: 'PUBLISHED', photoAssetId: null, updatedAt: now },
    settings: { id: 'main', title: 'My Portfolio', description: 'A student portfolio.', defaultTheme: 'dark', showAvailability: true, internalNotes: null, sectionOrder: ['home', 'work', 'about', 'contact'], sectionCopy: { work: ['Work title', '', 'Third text'] }, cvAssetId: null, cvPublished: false, updatedAt: now },
  };
  if (signedIn) await page.addInitScript(value => localStorage.setItem('portfolio-studio-auth', JSON.stringify(value)), authSession);
  await page.route('**/auth/v1/**', async route => {
    const request = route.request(), url = new URL(request.url());
    state.authCalls.push(url.pathname + url.search);
    if (url.pathname.endsWith('/logout')) return route.fulfill({ status: 204 });
    if (url.pathname.endsWith('/token')) {
      if (state.refreshFails && url.searchParams.get('grant_type') === 'refresh_token') return route.fulfill({ status: 400, json: { error: 'invalid_grant', error_description: 'Expired test refresh' } });
      authSession = session('refreshed');
      return route.fulfill({ status: 200, json: authSession });
    }
    if (url.pathname.endsWith('/user')) return route.fulfill({ json: user });
    return route.fulfill({ status: 404, json: { error: 'Unknown mock auth route' } });
  });
  await page.route('http://localhost:5432/**', async route => {
    const request = route.request(), url = new URL(request.url()), method = request.method();
    const headers = { 'Access-Control-Allow-Origin': 'http://localhost:5174', 'Access-Control-Allow-Headers': 'authorization,content-type', 'Access-Control-Allow-Methods': 'GET,PUT,POST,PATCH,DELETE,OPTIONS' };
    const respond = (data, status = 200) => route.fulfill({ status, json: data, headers });
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers });
    const path = url.pathname.replace('/api/admin/', '');
    const [resource, recordId, action] = path.split('/');
    if (!request.headers().authorization?.startsWith('Bearer ')) state.badAuthorization++;
    if (method === 'GET') state.reads.push(path);
    if (resource === 'me') {
      if (delayMe) await new Promise(resolve => setTimeout(resolve, delayMe));
      state.meReady = true;
      return denied ? respond({ error: { message: 'This account is not an administrator.' } }, 403) : respond({ data: { id: ownerId } });
    }
    if (!state.meReady) state.prematureReads++;
    if (state.expire) { state.expire = false; return respond({ error: { message: 'Session expired.' } }, 401); }
    if (method === 'GET' && state.failedReads.has(resource)) return respond({ error: { message: 'Test service unavailable. Retry loading.' } }, 503);
    if (method !== 'GET') {
      const body = resource === 'uploads' ? null : request.postDataJSON();
      state.writes.push({ resource, recordId, action, method, body });
      if (state.failedWrites.has(resource)) return respond({ error: { message: 'Test save failed. Please retry.', details: [{ field: 'name', message: 'Rejected by test service.' }] } }, 422);
    }
    if (resource === 'uploads' && method === 'POST') {
      const kind = recordId === 'pdf' ? 'PDF' : 'IMAGE';
      const asset = { id: id(90 + state.records.assets.length), kind, originalName: kind === 'PDF' ? 'resume.pdf' : 'photo.png', mimeType: kind === 'PDF' ? 'application/pdf' : 'image/png', sizeBytes: 100, createdAt: now };
      state.records.assets.push(asset); return respond({ data: asset }, 201);
    }
    if (resource === 'assets' && action === 'file') return route.fulfill({ headers: { ...headers, 'Content-Type': 'image/png' }, body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9YL9l9sAAAAASUVORK5CYII=', 'base64') });
    if (resource === 'assets' && recordId === 'reconcile') return respond({ data: { checked: state.records.assets.length } });
    const records = state.records[resource];
    if (!records) return respond({ error: { message: 'Unknown mock resource: ' + resource } }, 404);
    if (resource === 'profile' || resource === 'settings') {
      if (method !== 'GET') Object.assign(records, request.postDataJSON(), { updatedAt: new Date().toISOString() });
      return respond({ data: records });
    }
    if (method === 'GET' && !recordId) {
      const page = Number(url.searchParams.get('page') || 1), limit = Number(url.searchParams.get('limit') || 20), read = url.searchParams.get('read');
      const filtered = resource === 'messages' && read ? records.filter(row => Boolean(row.readAt) === (read === 'true')) : records;
      return respond({ data: filtered.slice((page - 1) * limit, page * limit), meta: { page, limit, total: filtered.length } });
    }
    const row = records.find(record => record.id === recordId);
    if (method === 'GET') {
      if (state.failRecordReload) { state.failRecordReload = false; return respond({ error: { message: 'Reload unavailable' } }, 503); }
      return row ? respond({ data: row }) : respond({ error: { message: 'Missing record' } }, 404);
    }
    if (recordId === 'order') { request.postDataJSON().items.forEach(item => Object.assign(records.find(row => row.id === item.id), item)); records.sort((a, b) => a.sortOrder - b.sortOrder); return respond({ data: { updated: records.length } }); }
    if (method === 'DELETE') { records.splice(records.indexOf(row), 1); return route.fulfill({ status: 204, headers }); }
    const data = request.postDataJSON();
    const mapped = { ...data, ...(data.technologyIds ? { technologies: data.technologyIds.map(technologyId => ({ technologyId, technology: state.records.technologies.find(row => row.id === technologyId) })) } : {}) };
    if (method === 'POST') { const created = { ...mapped, id: id(100 + records.length), updatedAt: new Date().toISOString() }; records.push(created); return respond({ data: created }, 201); }
    if (resource === 'messages') Object.assign(row, { readAt: data.read ? now : null });
    else Object.assign(row, mapped, { updatedAt: new Date().toISOString() });
    return respond({ data: row });
  });
  page.on('dialog', dialog => dialog.dismiss());
  return state;
}
export async function open(page, path = '/overview') {
  await page.goto(path);
  await expect(page.getByRole('navigation', { name: 'Dashboard sections' })).toBeVisible();
}
