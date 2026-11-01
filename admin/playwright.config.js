import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', fullyParallel: false, workers: 1, timeout: 30000,
  use: { baseURL: 'http://localhost:5174', channel: 'chrome', headless: true, trace: 'off', screenshot: 'only-on-failure' },
  // Run Vite in the test process so teardown also works in restricted Windows shells.
  // All Auth and Express requests in this suite are intercepted. No live writes.
  globalSetup: './tests/start-server.js',
});
