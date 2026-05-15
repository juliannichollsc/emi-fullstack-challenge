import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveDefaultChromium } from './e2e/resolve-default-browser.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve the user's default browser (Brave, Chrome, Edge, ...). Any Chromium-based
// binary works because Playwright's chromium driver controls it via executablePath.
// Override with BROWSER_PATH=... for CI or non-default setups.
const { exe: detectedBrowser, source: browserSource, log: browserLog } = resolveDefaultChromium();
for (const line of browserLog) console.log(line);
const BROWSER_PATH = process.env.BROWSER_PATH ?? detectedBrowser;
if (!BROWSER_PATH) {
  throw new Error(
    '[playwright] No Chromium-based browser found. Install Brave / Chrome / Edge, or set BROWSER_PATH=path\\to\\browser.exe.',
  );
}
console.log(`[playwright] launching ${browserSource} → ${BROWSER_PATH}`);

// SLOW_MO defaults to 1000ms so a human can follow each click/fill in real time.
// Set SLOW_MO=0 for CI. Set SLOW_MO=2000 for a slower, demo-friendly pace.
const SLOW_MO = process.env.SLOW_MO ? Number(process.env.SLOW_MO) : 1000;

// Dedicated ports so the user's `pnpm dev` (5173) and `pnpm api` (3001) keep working in parallel.
const VITE_PORT = 5174;
const API_PORT = 3002;
const BASE_URL = `http://localhost:${VITE_PORT}`;
const API_URL = `http://127.0.0.1:${API_PORT}`;

export default defineConfig({
  testDir: path.resolve(__dirname, 'e2e'),
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // single json-server instance — sequential is safer for state.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: path.resolve(__dirname, 'e2e', 'global-setup.ts'),
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'brave-desktop',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          executablePath: BROWSER_PATH,
          // User asked to "see the browser open". Default headed; CI overrides via env.
          headless: process.env.HEADLESS === '1',
          slowMo: SLOW_MO,
          args: [
            '--disable-features=BraveRewards,BraveWallet,BraveVPN,BraveSync',
            '--no-default-browser-check',
            '--no-first-run',
            '--disable-search-engine-choice-screen',
          ],
        },
      },
    },
  ],
  webServer: [
    {
      command: `pnpm exec json-server --watch e2e/.tmp/db.test.json --port ${API_PORT} --host 127.0.0.1`,
      url: `${API_URL}/tasks`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: `pnpm exec vite --port ${VITE_PORT} --strictPort`,
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      stdout: 'ignore',
      stderr: 'pipe',
      env: { VITE_API_URL: API_URL },
    },
  ],
});

export { API_URL, BASE_URL };
