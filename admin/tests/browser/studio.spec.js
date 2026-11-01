import { test, expect } from '@playwright/test';
import { id, mockWorkspace, open, project } from './fixtures';

test('requires login before requesting or displaying protected content', async ({ page }) => {
  const state = await mockWorkspace(page, { signedIn: false });
  await page.goto('/projects');
  await expect(page.getByRole('heading', { name: 'Good to see you again.' })).toBeVisible();
  expect(state.reads).toHaveLength(0);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  expect(state.authCalls).toHaveLength(0);
  await page.getByLabel('Email address').fill('owner@example.test');
  await page.getByLabel('Password', { exact: true }).fill('mock-password-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Work worth sharing.' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Campus project campus-project' })).toBeVisible();
  expect(state.prematureReads).toBe(0); expect(state.badAuthorization).toBe(0);
});
test('restores sessions, waits for authorization, and denies non-admin accounts', async ({ page }) => {
  const state = await mockWorkspace(page, { denied: true, delayMe: 350 });
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Checking your admin access…' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Access denied.' })).toBeVisible();
  await expect(page.getByLabel('Full name')).toHaveCount(0);
  expect(state.reads.every(path => path === 'me')).toBe(true); expect(state.prematureReads).toBe(0);
});
test('overview uses actual counts and preserves dark/light theme selection', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await mockWorkspace(page); await open(page);
  await expect(page.locator('.admin-stat').first().locator('strong')).toHaveText('1');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.screenshot({ path: 'test-results/review-overview-dark.png', fullPage: true });
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.screenshot({ path: 'test-results/review-overview-light.png', fullPage: true });
  await page.reload(); await expect(page.getByRole('heading', { name: 'Your ideas, in one place.' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});
test('validates projects, saves drafts, reloads records and publishes only after confirmation', async ({ page }) => {
  const state = await mockWorkspace(page); await open(page, '/projects');
  await page.getByRole('button', { name: 'Add project', exact: true }).click();
  const modal = page.getByRole('dialog').last();
  await modal.getByRole('button', { name: 'Save changes' }).click(); expect(state.writes).toHaveLength(0);
  await modal.getByLabel('URL slug').fill('new-project'); await modal.getByLabel('Project title').fill('New project');
  await modal.getByLabel('Short description').fill('A new academic project.'); await modal.getByLabel('The problem').fill('A real problem.'); await modal.getByLabel('The proposed solution').fill('A proposed solution.');
  await modal.getByRole('checkbox', { name: 'React', exact: true }).check();
  await page.screenshot({ path: 'test-results/review-project-editor.png', fullPage: true });
  await modal.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(state.writes[0].body.status).toBe('DRAFT'); expect(state.writes[0].body.technologyIds).toEqual([id(20)]);
  expect(state.reads).toContain('projects/' + state.records.projects[1].id);
  await page.getByRole('button', { name: 'Publish New project', exact: true }).click();
  expect(state.writes).toHaveLength(1);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click(); expect(state.writes).toHaveLength(1);
  await page.getByRole('button', { name: 'Publish New project', exact: true }).click(); await page.getByRole('button', { name: 'Publish project', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Unpublish New project', exact: true })).toBeVisible();
  expect(state.writes.at(-1).action).toBe('publication');
  await page.getByRole('button', { name: 'Edit New project', exact: true }).click();
  await page.getByLabel('Project title').fill('Updated project'); await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(Object.hasOwn(state.writes.at(-1).body, 'status')).toBe(false);
});
test('shows API errors, retries collection loading and never claims a failed save succeeded', async ({ page }) => {
  const state = await mockWorkspace(page); state.failedReads.add('projects'); await open(page, '/projects');
  await expect(page.getByRole('heading', { name: 'This content could not be loaded.' })).toBeVisible();
  state.failedReads.clear(); await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await page.getByRole('button', { name: 'Edit Campus project', exact: true }).click(); await page.getByLabel('Project title').fill('Changed');
  state.failedWrites.add('projects'); await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('alert')).toContainText('Test save failed. Please retry.');
  await expect(page.getByRole('dialog')).toHaveCount(1); await expect(page.locator('.toast.show')).toHaveCount(0);
  expect(state.records.projects[0].name).toBe('Campus project');
  state.failedWrites.clear(); await page.getByRole('button', { name: 'Save changes' }).click(); await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('reloads a saved record without resubmitting it when its first reload fails', async ({ page }) => {
  const state = await mockWorkspace(page); await open(page, '/projects');
  await page.getByRole('button', { name: 'Edit Campus project', exact: true }).click();
  await expect(page.getByLabel('Project title')).toHaveValue('Campus project');
  await page.getByLabel('Project title').fill('Saved once'); state.failRecordReload = true;
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('alert')).toContainText('change was accepted');
  await page.getByRole('button', { name: 'Reload saved record' }).click(); await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(state.writes.filter(write => write.resource === 'projects')).toHaveLength(1);
});
test('loads every collection page and persists feature, ordering and confirmed deletion', async ({ page }) => {
  const state = await mockWorkspace(page);
  state.records.projects = Array.from({ length: 102 }, (_, index) => ({ ...project, id: id(200 + index), name: 'Project ' + index, slug: 'project-' + index, sortOrder: index }));
  await open(page, '/projects');
  await expect(page.getByText('102 records', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Feature Project 0', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Unfeature Project 0', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Move Project 1 earlier', exact: true }).click();
  await expect.poll(() => state.writes.filter(write => write.recordId === 'order').length).toBe(2);
  await expect(page.getByRole('button', { name: 'Delete Project 1', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Delete Project 1', exact: true }).click(); await page.getByRole('button', { name: 'Delete record', exact: true }).click();
  await expect(page.getByText('101 records', { exact: true })).toBeVisible();
});
test('views saved messages without marking them, then explicitly updates or deletes them', async ({ page }) => {
  const state = await mockWorkspace(page); await open(page, '/messages');
  await page.getByRole('button', { name: /A collaboration Visitor/ }).click();
  await expect(page.getByText('Let us build something useful.')).toBeVisible(); expect(state.writes).toHaveLength(0);
  await page.getByRole('button', { name: 'Mark read', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Mark unread', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Mark unread', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Mark read', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Delete', exact: true }).click(); await page.getByRole('button', { name: 'Delete message', exact: true }).click();
  await expect(page.getByText('Your inbox is clear.')).toBeVisible();
  expect(state.reads.some(path => /^messages\//.test(path))).toBe(false);
});
test('uploads photos privately and attaches them through the profile API', async ({ page }) => {
  const state = await mockWorkspace(page); await open(page, '/profile');
  await expect(page.getByLabel('Full name')).toHaveValue('Portfolio Owner');
  await page.screenshot({ path: 'test-results/review-profile-dark.png', fullPage: true });
  await page.locator('input[type=file]').setInputFiles({ name: 'bad.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') });
  await expect(page.getByRole('alert')).toContainText('SVG is not supported'); expect(state.writes).toHaveLength(0);
  await page.locator('input[type=file]').setInputFiles({ name: 'photo.png', mimeType: 'image/png', buffer: Buffer.from('mock image bytes') });
  await expect(page.getByRole('img', { name: 'Selected uploaded image' })).toBeVisible();
  expect(state.writes).toHaveLength(1); expect(state.writes[0].resource).toBe('uploads'); expect(state.records.profile.photoAssetId).toBeNull();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect.poll(() => state.records.profile.photoAssetId).toBe(id(90));
  expect(state.writes[1].resource).toBe('profile'); expect(state.badAuthorization).toBe(0);
});
test('refreshes expired access tokens and removes management UI on terminal session failure', async ({ page }) => {
  const state = await mockWorkspace(page); await open(page, '/projects');
  state.expire = true; await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Edit Campus project', exact: true })).toBeVisible();
  expect(state.authCalls.some(call => call.includes('grant_type=refresh_token'))).toBe(true);
  state.expire = true; state.refreshFails = true; await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Good to see you again.' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Dashboard sections' })).toHaveCount(0);
});
test('supports mobile keyboard navigation, modal focus and confirmed logout', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await mockWorkspace(page); await page.goto('/projects');
  await expect(page.getByRole('button', { name: 'Edit Campus project', exact: true })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Dashboard sections' })).toHaveCount(0);
  await page.screenshot({ path: 'test-results/review-projects-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Open dashboard navigation' }).click();
  await expect(page.getByRole('navigation', { name: 'Dashboard sections' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Overview', exact: true })).toBeFocused();
  await page.keyboard.press('Escape'); await expect(page.getByRole('button', { name: 'Open dashboard navigation' })).toBeFocused();
  await page.getByRole('button', { name: 'Add project', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Close dialog' })).toBeFocused();
  await page.keyboard.press('Shift+Tab'); await expect(page.getByRole('button', { name: 'Save changes' })).toBeFocused();
  await page.keyboard.press('Escape'); await expect(page.getByRole('button', { name: 'Add project', exact: true })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Open dashboard navigation' }).click(); await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Good to see you again.' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('portfolio-studio-auth'))).toBeNull();
});

test('edits supported site settings and publishes a real uploaded CV only explicitly', async ({ page }) => {
  const state = await mockWorkspace(page); await open(page, '/settings');
  await page.getByLabel('Website title', { exact: true }).fill('Updated portfolio');
  await page.getByText('work · 3 text items', { exact: true }).click(); await page.getByRole('textbox', { name: 'work text 1', exact: true }).fill('Updated title');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.locator('.toast.show')).toContainText('Changes saved and reloaded.');
  expect(state.records.settings.title).toBe('Updated portfolio'); expect(state.records.settings.sectionCopy.work).toEqual(['Updated title', '', 'Third text']);
  await page.getByRole('link', { name: 'CV / Resume', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Publish this CV for visitors' }).check();
  await page.getByRole('button', { name: 'Save CV settings' }).click(); await expect(page.getByRole('alert')).toContainText('Attach a real PDF');
  expect(state.writes).toHaveLength(1);
  await page.locator('input[type=file]').setInputFiles({ name: 'resume.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7 mock bytes') });
  await expect(page.getByLabel('CV PDF', { exact: true })).toHaveValue(id(90)); expect(state.records.settings.cvPublished).toBe(false);
  await page.getByRole('button', { name: 'Save CV settings' }).click(); expect(state.records.settings.cvPublished).toBe(false);
  await page.getByRole('button', { name: 'Save CV availability' }).click();
  await expect.poll(() => state.records.settings.cvPublished).toBe(true);
  expect(state.writes.at(-1).body).toEqual({ cvAssetId: id(90), cvPublished: true });
});

for (const resource of [
  { path: 'technologies', singular: 'technology', values: { 'Technology name': 'Node.js' } },
  { path: 'skill-categories', singular: 'category', values: { 'URL slug': 'tools', 'Category name': 'Tools' } },
  { path: 'skills', singular: 'skill', values: { 'Skill name': 'React' }, select: { 'Category': id(30) } },
  { path: 'education', singular: 'education record', values: { 'URL slug': 'degree', 'Institution': 'University', 'Degree / qualification': 'Software Engineering', 'Study status': 'Undergraduate' } },
  { path: 'experience', singular: 'experience record', values: { 'URL slug': 'collaboration', 'Title': 'Academic collaboration' } },
  { path: 'learning-topics', singular: 'learning topic', values: { 'URL slug': 'apis', 'Topic name': 'APIs', 'Category': 'Software', 'Public description': 'Learning API design', 'Next practice goal': 'Build a small API' } },
  { path: 'milestones', singular: 'milestone', values: { 'URL slug': 'foundation', 'Milestone title': 'Foundation', 'Description': 'A real foundation', 'Category': 'Education', 'Route label': 'First step' } },
  { path: 'certificates', singular: 'certificate', values: { 'URL slug': 'certificate', 'Certificate / achievement title': 'Completed course', 'Issuing organisation': 'University' } },
  { path: 'social-links', singular: 'social link', values: { 'Platform': 'GitHub', 'Profile URL': 'https://github.com/example' } },
]) {
  test(`creates and reloads ${resource.path} through the documented endpoint`, async ({ page }) => {
    const state = await mockWorkspace(page); await open(page, '/' + resource.path);
    await page.getByRole('button', { name: 'Add ' + resource.singular, exact: true }).click();
    for (const [label, value] of Object.entries(resource.values)) await page.getByRole('dialog').getByLabel(label, { exact: true }).fill(value);
    for (const [label, value] of Object.entries(resource.select || {})) await page.getByRole('dialog').getByLabel(label, { exact: true }).selectOption(value);
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0); expect(state.writes.at(-1).resource).toBe(resource.path);
    expect(state.writes.at(-1).method).toBe('POST'); expect(state.reads).toContain(resource.path + '/' + state.records[resource.path].at(-1).id);
    if (resource.path !== 'technologies') expect(state.writes.at(-1).body.status).toBe('DRAFT');
  });
}
