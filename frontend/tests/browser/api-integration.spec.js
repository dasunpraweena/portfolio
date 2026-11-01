import { test, expect } from '@playwright/test';
import { mockApi, portfolio, projects, jsonResponse } from './api-fixture';

test.beforeEach(async ({ page }) => { await mockApi(page); });
async function fillMessage(page) {
  await page.getByLabel('Your name').fill(' Visitor ');
  await page.getByLabel('Email address').fill('visitor@example.com');
  await page.getByLabel('Subject', { exact: true }).fill(' Ideas & questions ');
  await page.getByLabel('Your message').fill('Hello 👋\nReact & C#?');
}

test('shows portfolio loading and a retryable error without displaying local content', async ({ page }) => {
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  let attempts = 0;
  await page.route('**/api/portfolio', async route => {
    attempts++;
    if (attempts === 1) { await pending; return route.fulfill({ ...jsonResponse({ error: { message: 'Temporarily unavailable' } }), status: 503 }); }
    return route.fulfill(jsonResponse({ data: portfolio }));
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Loading portfolio…' })).toBeVisible();
  await expect(page.locator('#home')).toHaveCount(0);
  release();
  await expect(page.getByRole('heading', { name: 'This content could not be loaded.' })).toBeVisible();
  await expect(page.locator('.project-card')).toHaveCount(0);
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.locator('#home h1')).toHaveText('Ideas to code.Code to impact.');
});

test('uses current API fields even when section copy still contains older profile text', async ({ page }) => {
  const content = structuredClone(portfolio);
  content.profile.name = 'Updated portfolio name';
  content.profile.heroTitle = ['A new idea.', 'A new direction.'];
  content.profile.introduction = 'A current introduction supplied by the API.';
  content.profile.about = ['A current biography supplied by the API.'];
  content.learningTopics[0].title = 'A current learning topic';
  content.milestones[0].title = 'A current milestone';
  await mockApi(page, { content });
  await page.goto('/');
  await expect(page.locator('#home h1')).toHaveText('A new idea.A new direction.');
  await expect(page.locator('.eyebrow')).toContainText(content.profile.name);
  await expect(page.locator('.hero-desc')).toHaveText(content.profile.introduction);
  await expect(page.locator('.about-copy > p').nth(1)).toHaveText(content.profile.about[0]);
  await expect(page.getByRole('heading', { name: 'A current learning topic' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'A current milestone' })).toBeVisible();
});

test('renders a valid empty published project list without any draft outlines', async ({ page }) => {
  await mockApi(page, { collection: [] });
  await page.goto('/#work');
  await expect(page.getByRole('heading', { name: 'No published projects yet.' })).toBeVisible();
  await expect(page.locator('.project-card')).toHaveCount(0);
  await expect(page.getByText('Student Marketplace', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Web & Mobile', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No published projects in this category.' })).toBeVisible();
  await expect(page.locator('#home')).toBeAttached();
});

test('project and detail errors can be retried independently of the portfolio', async ({ page }) => {
  let failList = true;
  await page.route('**/api/projects?*', route => failList ? route.fulfill({ ...jsonResponse({ error: { message: 'Unavailable' } }), status: 500 }) : route.fallback());
  await page.goto('/#work');
  await expect(page.getByRole('heading', { name: 'Projects could not be loaded.' })).toBeVisible();
  await expect(page.locator('.project-card')).toHaveCount(0);
  failList = false;
  await page.locator('#work').getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.locator('.project-card')).toHaveCount(4);
  let failDetail = true;
  await page.route('**/api/projects/marketplace', route => failDetail ? route.fulfill({ ...jsonResponse({ error: { message: 'Unavailable' } }), status: 500 }) : route.fallback());
  await page.getByRole('link', { name: 'Student Marketplace', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Project details could not be loaded.' })).toBeVisible();
  failDetail = false;
  await page.getByRole('dialog').getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Student Marketplace', exact: true })).toBeVisible();
});

test('follows pagination before exposing the view-all interaction', async ({ page }) => {
  const collection = Array.from({ length: 105 }, (_, index) => ({ ...projects[0], id: 'project-' + index, slug: 'project-' + index, name: 'Project ' + index, sortOrder: index }));
  await mockApi(page, { collection });
  await page.goto('/#work');
  await expect(page.locator('.project-card')).toHaveCount(4);
  await page.getByRole('button', { name: 'View all 105 projects' }).click();
  await expect(page.locator('.project-card')).toHaveCount(105);
  await expect(page.getByRole('link', { name: 'Project 104', exact: true })).toBeAttached();
});

test('contact validates required and whitespace-only fields before posting', async ({ page }) => {
  let submitted = 0;
  page.on('request', request => { if (request.method() === 'POST' && request.url().endsWith('/api/messages')) submitted++; });
  await page.goto('/#contact');
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  expect(await page.locator('#contact-form').evaluate(form => form.checkValidity())).toBe(false);
  await fillMessage(page); await page.getByLabel('Your name').fill('  ');
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await expect(page.getByLabel('Your name')).toBeFocused(); expect(submitted).toBe(0);
});

test('contact stays pending until the API confirms a save and prevents duplicate submissions', async ({ page }) => {
  let release, submitted = 0, body;
  const pending = new Promise(resolve => { release = resolve; });
  await page.route('**/api/messages', async route => {
    if (route.request().method() !== 'POST') return route.fallback();
    submitted++; body = route.request().postDataJSON(); await pending;
    return route.fulfill({ ...jsonResponse({ data: { accepted: true } }), status: 201 });
  });
  await page.goto('/#contact'); await fillMessage(page);
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Saving message…' })).toBeDisabled();
  await expect(page.locator('#contact-form').getByRole('status')).toHaveCount(0);
  await page.locator('#contact-form').evaluate(form => form.requestSubmit());
  expect(submitted).toBe(1); release();
  await expect(page.locator('#contact-form').getByRole('status')).toHaveText('Your message was saved. Thank you for reaching out.');
  expect(body).toEqual({ name: 'Visitor', email: 'visitor@example.com', subject: 'Ideas & questions', message: 'Hello 👋\nReact & C#?' });
  await expect(page.getByLabel('Your message')).toHaveValue('');
  await expect(page.locator('#contact-hint')).toContainText('No email is sent automatically.');
});

test('contact keeps entered text on failure and retries only when requested', async ({ page }) => {
  let attempts = 0;
  await page.route('**/api/messages', route => {
    if (route.request().method() !== 'POST') return route.fallback();
    attempts++;
    return route.fulfill(attempts === 1 ? { ...jsonResponse({ error: { message: 'Unavailable' } }), status: 503 } : { ...jsonResponse({ data: { accepted: true } }), status: 201 });
  });
  await page.goto('/#contact'); await fillMessage(page);
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await expect(page.locator('#contact-form').getByRole('alert')).toContainText('could not confirm');
  await expect(page.getByLabel('Your message')).toHaveValue('Hello 👋\nReact & C#?');
  await expect(page.locator('#contact-form').getByRole('status')).toHaveCount(0);
  expect(attempts).toBe(1);
  await page.getByRole('button', { name: 'Retry message', exact: true }).click();
  await expect(page.locator('#contact-form').getByRole('status')).toContainText('Your message was saved.'); expect(attempts).toBe(2);
});

test('contact handles rate limits and unconfirmed responses without a false success', async ({ page }) => {
  let rateLimited = true;
  await page.route('**/api/messages', route => {
    if (route.request().method() !== 'POST') return route.fallback();
    return route.fulfill(rateLimited ? { ...jsonResponse({ error: { message: 'Try later' } }), status: 429, headers: { ...jsonResponse(null).headers, 'retry-after': '180', 'access-control-expose-headers': 'retry-after' } } : jsonResponse({ data: { accepted: false } }));
  });
  await page.goto('/#contact'); await fillMessage(page);
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await expect(page.locator('#contact-form').getByRole('alert')).toContainText('3 minutes');
  rateLimited = false;
  await page.getByRole('button', { name: 'Retry message', exact: true }).click();
  await expect(page.locator('#contact-form').getByRole('alert')).toContainText('could not confirm');
  await expect(page.locator('#contact-form').getByRole('status')).toHaveCount(0);
});

test('education and academic experience remain accessible through the existing milestone icons', async ({ page }) => {
  await page.goto('/#journey');
  await page.getByRole('button', { name: 'View education details' }).click();
  await expect(page.getByRole('dialog').getByText('Data Structures and Algorithms')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'View experience & activities details' }).first().click();
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Industry visit to Bhasha Lanka' })).toBeVisible();
});

test('maps API-relative screenshots, social URLs, and CV downloads to the backend origin', async ({ page }) => {
  const content = structuredClone(portfolio), collection = structuredClone(projects);
  content.settings.cv = { url: '/api/assets/cv', kind: 'PDF' };
  content.profile.photo = { url: '/api/assets/photo', kind: 'IMAGE' };
  content.socialLinks[0].url = 'https://github.com/example';
  collection[0].screenshots = [{ url: '/api/assets/screen', caption: 'A supplied project screen', illustrative: false }];
  await mockApi(page, { content, collection });
  await page.route('**/api/assets/*', route => route.fulfill({ status: 200, headers: jsonResponse(null).headers, contentType: route.request().url().endsWith('/cv') ? 'application/pdf' : 'image/png', body: route.request().url().endsWith('/cv') ? Buffer.from('%PDF-1.4\n%%EOF') : Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64') }));
  await page.goto('/');
  await expect(page.locator('.profile-photo')).toHaveAttribute('src', 'http://localhost:5432/api/assets/photo');
  await expect(page.locator('.real-screenshot')).toHaveAttribute('src', 'http://localhost:5432/api/assets/screen');
  await expect(page.getByRole('link', { name: 'GitHub' }).first()).toHaveAttribute('href', 'https://github.com/example');
  await page.getByRole('button', { name: 'Download CV', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Download PDF' })).toHaveAttribute('href', 'http://localhost:5432/api/assets/cv');
  await expect(page.getByRole('dialog').locator('object')).toHaveAttribute('data', /^blob:/);
});
