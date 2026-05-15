import { test as base, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { installVisualCursor } from './visual-cursor';

export const API_URL = 'http://127.0.0.1:3002';
const VISUAL_CURSOR = process.env.VISUAL_CURSOR === '1';

const SEED_TMP_PATH = path.resolve(process.cwd(), 'e2e', '.tmp', 'db.test.json');
const SEED_SOURCE = path.resolve(process.cwd(), 'doc', 'db 1.json');

function makeSeedJson(): string {
  const raw = JSON.parse(fs.readFileSync(SEED_SOURCE, 'utf8'));
  return JSON.stringify(
    {
      tasks: raw.tasks.map((t: Record<string, unknown>, i: number) => ({ id: String(i + 1), ...t })),
      states: raw.states,
    },
    null,
    2,
  );
}

const FRESH_SEED = makeSeedJson();

/**
 * Reset the db by overwriting the file in one atomic write.
 * json-server's --watch mode picks up the change and reloads in-memory state.
 * Far gentler than hammering it with 14 DELETE + 10 POST per test.
 */
async function resetDb() {
  fs.writeFileSync(SEED_TMP_PATH, FRESH_SEED, 'utf8');
  // Let json-server's watcher debounce + reload (~150-250ms in practice).
  await new Promise((r) => setTimeout(r, 400));
}

// 2s of "human analysis time" between tests, configurable via INTER_TEST_PAUSE_MS.
const INTER_TEST_PAUSE_MS = Number(process.env.INTER_TEST_PAUSE_MS ?? 2000);

export const test = base.extend<{ seedDb: void }>({
  seedDb: [
    async ({ page }, use) => {
      if (VISUAL_CURSOR) await installVisualCursor(page);
      await resetDb();
      await use();
      if (INTER_TEST_PAUSE_MS > 0) await page.waitForTimeout(INTER_TEST_PAUSE_MS);
    },
    { auto: true },
  ],
});

export { expect };
