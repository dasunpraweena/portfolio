import fs from 'node:fs';
export const portfolio = JSON.parse(fs.readFileSync(new URL('../fixtures/portfolio.json', import.meta.url), 'utf8'));
const outlines = JSON.parse(fs.readFileSync(new URL('../../src/data/projects.json', import.meta.url), 'utf8'));
// Simulated published API responses for UI tests; no real project is published.
export const projects = outlines.map((project, sortOrder) => ({ ...project, slug: project.id, technologies: project.tech.filter(name => ['C#', 'MySQL', 'SPSS'].includes(name)), screenshots: [], implementationStatus: null, verified: false, sortOrder }));
export const jsonResponse = data => ({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'Content-Type' }, body: JSON.stringify(data) });

export async function mockApi(page, { content = portfolio, collection = projects } = {}) {
  await page.route('http://localhost:5432/api/**', async route => {
    const url = new URL(route.request().url());
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: jsonResponse(null).headers });
    if (url.pathname === '/api/portfolio') return route.fulfill(jsonResponse({ data: content }));
    if (url.pathname === '/api/projects') {
      const category = url.searchParams.get('category');
      const filtered = collection.filter(project => !category || category === 'all' || project.filter === category);
      const pageNumber = Number(url.searchParams.get('page') || 1), limit = Number(url.searchParams.get('limit') || 100);
      return route.fulfill(jsonResponse({ data: filtered.slice((pageNumber - 1) * limit, pageNumber * limit), meta: { page: pageNumber, limit, total: filtered.length } }));
    }
    if (url.pathname.startsWith('/api/projects/')) {
      const project = collection.find(item => item.slug === decodeURIComponent(url.pathname.split('/').pop()));
      return route.fulfill(project ? jsonResponse({ data: project }) : { ...jsonResponse({ error: { code: 'NOT_FOUND', message: 'This record does not exist.' } }), status: 404 });
    }
    if (url.pathname === '/api/messages') return route.fulfill({ ...jsonResponse({ data: { accepted: true } }), status: 201 });
    return route.fulfill({ ...jsonResponse({ error: { code: 'NOT_FOUND', message: 'Not found' } }), status: 404 });
  });
}
