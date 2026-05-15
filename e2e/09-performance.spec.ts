// PDF Task 9 · Performance
// Route-level code splitting: the chunk for /states must not load until we navigate there.
import { test, expect } from './fixtures';

test.describe('Task 9 · Performance', () => {
  test('lazy chunks load on navigation, not on initial /tasks visit', async ({ page }) => {
    const jsRequests = new Set<string>();
    page.on('request', (req) => {
      if (req.resourceType() === 'script') jsRequests.add(req.url());
    });

    await page.goto('/tasks');
    await expect(page.getByRole('heading', { name: 'Tareas', level: 2 })).toBeVisible();
    const initialJs = new Set(jsRequests);

    await page.getByRole('link', { name: 'Estados', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Estados', level: 2 })).toBeVisible();

    // At least one new JS request appeared after navigating to /states
    // (the lazy chunk for StatesPage). This proves React.lazy / code-splitting is wired.
    const newChunks = [...jsRequests].filter((u) => !initialJs.has(u));
    expect(newChunks.length).toBeGreaterThan(0);
  });
});
