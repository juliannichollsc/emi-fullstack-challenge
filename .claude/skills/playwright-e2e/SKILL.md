---
name: playwright-e2e
description: Use when writing or running end-to-end tests for the EMI task-app. Encodes the official Microsoft Playwright pattern, points the test runner at the user's existing Brave binary (no new browser downloaded), and maps every PDF Task to a deterministic spec. Owned by the e2e-tester agent.
---

# Playwright E2E — EMI Task App

This skill encodes how the `e2e-tester` agent runs **real browser tests** against the EMI task-app. The PDF (Tasks 1–10 + Bonus) is the source of truth; each task maps to one spec file.

## Why Playwright (security note for the user)

- **Test runner**: `@playwright/test` — Microsoft official, Apache-2.0, npm `@playwright/test` (~10M weekly downloads). Industry standard, used by Microsoft, Google, Disney, VS Code, etc.
- **Browser**: the user's **already-installed Brave** binary at `C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe`. Brave is Chromium-based so Playwright's chromium driver controls it.
- **No new browser binaries are downloaded** by this skill — we **never** run `playwright install chromium`. We pass `executablePath` to launch the existing Brave instead. This avoids pulling third-party executables onto the machine.
- Optional MCP companion: Microsoft's official `@playwright/mcp` (https://claude.com/plugins/playwright) — same publisher, Apache-2.0. The user can opt-in later; this skill does not require it.

## Project layout

```
emi-task-app/
├── playwright.config.ts            ← launcher + webServer
├── e2e/
│   ├── fixtures.ts                 ← db reset + helpers
│   ├── seed.ts                     ← seed data derived from doc/db 1.json
│   ├── 01-project-setup.spec.ts    ← Task 1
│   ├── 02-task-component.spec.ts   ← Task 2
│   ├── 03-task-list.spec.ts        ← Task 3 (pagination, complete)
│   ├── 04-task-form.spec.ts        ← Task 4 (validation)
│   ├── 05-routing.spec.ts          ← Task 5 (all routes + 404)
│   ├── 06-state-management.spec.ts ← Task 6 (persistence)
│   ├── 07-testing.spec.ts          ← Task 7 (smoke + cross-task wiring)
│   ├── 08-error-handling.spec.ts   ← Task 8 (toast + ErrorBoundary)
│   ├── 09-performance.spec.ts      ← Task 9 (lazy chunks)
│   ├── 10-responsive.spec.ts       ← Task 10 (mobile/tablet/desktop)
│   ├── bonus-state-form.spec.ts    ← Bonus
│   └── .tmp/                       ← runtime-only test db (gitignored)
└── package.json                    ← test:e2e / test:e2e:headed / test:e2e:ui
```

## Hard rules (non-negotiable)

1. **Brave is the only launcher.** Never override `executablePath` to plain Chromium or download Playwright's bundled browser. The user wants Brave.
2. **Isolated test DB.** Always seed `e2e/.tmp/db.test.json` from `doc/db 1.json` before each test run (globalSetup). Never mutate `public/db.json` from tests.
3. **Dedicated ports.** Vite dev → `5174`, json-server → `3002`. The user's `pnpm dev`/`pnpm api` (5173/3001) stay free.
4. **Headed by default.** The user explicitly asked to "see Brave open". `headless: false` is the default; CI can override with `HEADLESS=1`.
5. **No new binaries on disk** beyond npm packages. If a test asks for a non-Chromium browser, refuse.
6. **PDF scope only.** Each spec must trace back to a Task in `doc/`. No invented behavior, no fields outside `doc/db 1.json`.

## Launching Brave from Playwright

```ts
// playwright.config.ts (essentials)
import { defineConfig, devices } from '@playwright/test';

const BRAVE = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,         // single json-server instance, sequential is safer
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'brave-desktop',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          executablePath: BRAVE,
          headless: process.env.HEADLESS === '1',
          args: [
            '--disable-features=BraveRewards,BraveWallet,BraveVPN',
            '--no-default-browser-check',
            '--no-first-run',
          ],
        },
      },
    },
  ],
  globalSetup: './e2e/global-setup.ts',
  webServer: [
    {
      // json-server pointed at the isolated test db
      command: 'pnpm exec json-server --watch e2e/.tmp/db.test.json --port 3002 --host 127.0.0.1',
      url: 'http://127.0.0.1:3002/tasks',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      // Vite dev with VITE_API_URL pointed at the test json-server
      command: 'pnpm exec vite --port 5174 --strictPort',
      url: 'http://localhost:5174',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      env: { VITE_API_URL: 'http://127.0.0.1:3002' },
    },
  ],
});
```

> `--disable-features=BraveRewards,BraveWallet,BraveVPN` silences Brave's onboarding modals, which otherwise block Playwright's first navigation.

## Selector priority (mirrors jest-best-practices)

1. `getByRole('button', { name: /eliminar/i })` — preferred.
2. `getByLabel('Título')` — form fields.
3. `getByText('Tareas')` — static headings.
4. `getByPlaceholder('Nota 1')`.
5. `getByTestId(...)` — last resort, only if no a11y handle exists.

The app uses Spanish UI labels (`Tareas`, `Nueva tarea`, `Editar`, `Eliminar`, `Agregar nota`, `Guardar`, `Crear tarea`, `Estados`). Use them verbatim.

## DB reset pattern

`e2e/global-setup.ts` copies `doc/db 1.json` → `e2e/.tmp/db.test.json` once before the suite. Per-test isolation is achieved by a `seedDb` fixture that PATCHes/DELETEs everything via the json-server REST API back to the seed snapshot before each test.

```ts
// e2e/fixtures.ts (essentials)
import { test as base } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const SEED = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'doc', 'db 1.json'), 'utf8'),
);

export const test = base.extend<{ seedDb: void }>({
  seedDb: [
    async ({ request }, use) => {
      // Reset: delete all current tasks/states, repost the seed.
      const tasks = await (await request.get('http://127.0.0.1:3002/tasks')).json();
      for (const t of tasks) await request.delete(`http://127.0.0.1:3002/tasks/${t.id}`);
      const states = await (await request.get('http://127.0.0.1:3002/states')).json();
      for (const s of states) {
        await request.delete(`http://127.0.0.1:3002/states/${encodeURIComponent(s.name)}`);
      }
      for (const t of SEED.tasks) await request.post('http://127.0.0.1:3002/tasks', { data: t });
      for (const s of SEED.states) await request.post('http://127.0.0.1:3002/states', { data: s });
      await use();
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
```

## PDF Task → spec contract

| PDF Task | Spec file | What to assert |
|---|---|---|
| 1 Project setup | `01-project-setup.spec.ts` | App boots at `/`, redirects to `/tasks`, header EMI visible. |
| 2 Task component | `02-task-component.spec.ts` | Each card shows title/description/dueDate, last state badge, ≥1 note bullet, Editar + Eliminar buttons. |
| 3 TaskList + pagination | `03-task-list.spec.ts` | 5 items per page, page 2 reachable, checkbox marks complete and persists. |
| 4 TaskForm validation | `04-task-form.spec.ts` | Empty submit shows all errors; ≥1 nota required; valid submit creates a task and redirects. |
| 5 Routing | `05-routing.spec.ts` | `/`, `/tasks`, `/tasks/new`, `/tasks/:id`, `/tasks/:id/edit`, `/states`, `/lol-404` all resolve correctly. |
| 6 Access data (state mgmt) | `06-state-management.spec.ts` | Create on `/tasks/new`, reload, the new task still renders → context + service + db wired. |
| 7 Testing | `07-testing.spec.ts` | Smoke covering CRUD: create → edit → toggle complete → delete. |
| 8 Error handling | `08-error-handling.spec.ts` | Mock 500 on `/tasks` → error UI visible with `role="alert"`; ErrorBoundary catches a thrown route. |
| 9 Performance | `09-performance.spec.ts` | Lazy chunk for `/states` arrives only when navigating there (network assertion). |
| 10 Responsive | `10-responsive.spec.ts` | Iterate 3 viewports (375, 768, 1280); hamburger visible <md; nav links visible ≥md. |
| Bonus | `bonus-state-form.spec.ts` | Create state, duplicate rejected, delete state. |

## AAA spec template

```ts
import { test, expect } from './fixtures';

test('Task 3 — paginates 5 per page', async ({ page }) => {
  // Arrange
  await page.goto('/tasks');

  // Act
  await expect(page.getByRole('heading', { name: 'Tareas' })).toBeVisible();

  // Assert
  const cards = page.locator('ul[aria-label="Lista de tareas"] > li');
  await expect(cards).toHaveCount(5);
  await page.getByRole('button', { name: 'Ir a página 2' }).click();
  await expect(cards).toHaveCount(1); // seed has 6 tasks → page 2 has 1
});
```

## Scripts (add to `package.json`)

```json
{
  "test:e2e": "playwright test",
  "test:e2e:headed": "playwright test --headed",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:report": "playwright show-report"
}
```

## Anti-patterns

- Hard-coded `sleep(2000)` — use `await expect(...)` with auto-retry.
- DOM snapshots — assert behavior, not markup.
- Querying by class name — use roles/labels/text.
- Reusing `public/db.json` — always use `e2e/.tmp/db.test.json`.
- Downloading Playwright's bundled Chromium — we use Brave only.

## Reproducibility

```bash
pnpm install                # if @playwright/test was just added
pnpm test:e2e               # full run, Brave headed (default)
HEADLESS=1 pnpm test:e2e    # CI mode
pnpm test:e2e:ui            # interactive Playwright UI
pnpm test:e2e -- 04-task    # one spec
```

## When this skill ends and tasks survive

The skill ends when:
- All specs map to a PDF task and pass against the seeded test db.
- `pnpm test:e2e` is documented in `package.json` and works without extra setup besides `pnpm install`.
- The user can see Brave open.

If a spec fails because the UI doesn't support a role/name yet, **do not patch the test** — surface the gap so the orchestrator delegates the UI fix to `ui-designer`.
