import { test, expect } from '@playwright/test';

test('loads all public sections without errors and keeps the admin prototype out', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ideas to code.Code to impact.');
  for (const section of ['home', 'work', 'about', 'skills', 'learning', 'journey', 'contact']) await expect(page.locator('#' + section)).toBeAttached();
  await expect(page.locator('.learning-card')).toHaveCount(4);
  await expect(page.locator('.skill-group')).toHaveCount(5);
  await expect(page.locator('.roadmap-step')).toHaveCount(6);
  await expect(page.getByText(/Admin (?:design )?preview/i)).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('filters projects and expands or collapses the complete collection', async ({ page }) => {
  await page.goto('/#work');
  await expect(page.locator('.project-card')).toHaveCount(4);
  await page.getByRole('button', { name: 'View all 6 projects' }).click();
  await expect(page.locator('.project-card')).toHaveCount(6);
  await page.getByRole('button', { name: 'Show selected projects' }).click();
  await expect(page.locator('.project-card')).toHaveCount(4);
  for (const [name, count] of [['Web & Mobile', 3], ['Software', 2], ['Data', 1], ['All projects', 4]]) {
    await page.getByRole('button', { name, exact: true }).click();
    await expect(page.locator('.project-card')).toHaveCount(count);
    await expect(page.getByRole('button', { name, exact: true })).toHaveAttribute('aria-pressed', 'true');
  }
});

test('opens routed project overlays, traps focus, and restores the project list', async ({ page }) => {
  await page.goto('/#work');
  const cardLink = page.getByRole('link', { name: 'Student Marketplace', exact: true });
  await cardLink.click();
  await expect(page).toHaveURL(/\/projects\/marketplace$/);
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Student Marketplace' })).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'My contribution' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close project details' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Open live demo' })).toBeFocused();
  await dialog.getByRole('button', { name: 'GitHub repository' }).click();
  await expect(page.getByRole('heading', { name: 'Repository link to add.' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/\/#work$/);
  await expect(cardLink).toBeFocused();
});

test('supports direct project routes, unknown projects, and a friendly 404', async ({ page }) => {
  for (const [id, title] of [['marketplace', 'Student Marketplace'], ['profix', 'ProFix'], ['supermarket', 'Supermarket Information System'], ['analytics', 'Student Performance Analytics'], ['house', 'House Service Booking System'], ['rocket', 'Rocket Landing Simulation']]) {
    await page.goto('/projects/' + id);
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Feature direction' })).toBeVisible();
  }
  await page.goto('/projects/missing');
  await expect(page.getByRole('heading', { name: "This project isn't in the notebook." })).toBeVisible();
  await page.goto('/this-page-does-not-exist');
  await expect(page.getByRole('heading', { name: /Let's find your way/ })).toBeVisible();
  await page.getByRole('link', { name: 'Back to home' }).click();
  await expect(page.locator('#home')).toBeVisible();
});

test('defaults to dark and remembers the selected theme across reloads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await page.evaluate(() => localStorage.getItem('dasun-portfolio-theme'))).toBe('light');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('explains unavailable CV and social links without creating broken links', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Download CV', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'CV not added yet' })).toBeVisible();
  await page.getByRole('button', { name: 'Got it' }).click();
  await page.getByRole('button', { name: 'GitHub' }).first().click();
  await expect(page.getByRole('heading', { name: 'Find me on GitHub.' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('validates contact fields and requests an email draft without claiming delivery', async ({ page }) => {
  await page.goto('/#contact');
  const submit = page.getByRole('button', { name: 'Create email draft' });
  await submit.click();
  expect(await page.locator('#contact-form').evaluate(form => form.checkValidity())).toBe(false);
  await page.getByLabel('Your name').fill('  ');
  await page.getByLabel('Email address').fill('visitor@example.com');
  await page.getByLabel('Subject', { exact: true }).fill('Hello & ideas');
  await page.getByLabel('Your message').fill('A project? Yes!');
  await submit.click();
  await expect(page.getByLabel('Your name')).toBeFocused();
  await page.getByLabel('Your name').fill('Visitor');
  await page.route('mailto:**', route => route.abort());
  await submit.click();
  await expect(page.getByRole('status')).toHaveText('Email draft requested. Review and send it in your email app.');
  await expect(page.getByText('Opens your email app with a draft. You review and send it there.')).toBeVisible();
});

test('mobile menu opens, closes with Escape, follows sections, and updates active navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const open = page.getByRole('button', { name: 'Open navigation' });
  await open.click();
  await expect(page.locator('#nav-links')).toHaveClass(/open/);
  await page.keyboard.press('Escape');
  await expect(open).toHaveAttribute('aria-expanded', 'false');
  await open.click();
  await page.getByRole('navigation').getByRole('link', { name: 'Learning', exact: true }).click();
  await expect(page).toHaveURL(/#learning$/);
  await expect(open).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#learning')).toBeInViewport();
  await expect.poll(() => page.locator('#learning').evaluate(element => Math.round(element.getBoundingClientRect().top))).toBeGreaterThanOrEqual(80);
  await expect(page.locator('#nav-links a[href="/#learning"]')).toHaveAttribute('aria-current', 'location');
});

for (const viewport of [{ width: 1440, height: 1000 }, { width: 820, height: 1180 }, { width: 390, height: 844 }]) {
  test(`keeps the layout within the viewport at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator('.hero-art')).toBeVisible();
    await expect(page.locator('.project-card')).toHaveCount(4);
    await page.screenshot({ path: `test-results/portfolio-${viewport.width}.png`, fullPage: true });
  });
}
