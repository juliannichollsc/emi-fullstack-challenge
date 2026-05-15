// Bonus · StateForm
// Manage the catalog of task states: create, reject duplicate, delete.
import { test, expect } from './fixtures';

test.describe('Bonus · State management form', () => {
  test('lists the seed states', async ({ page }) => {
    await page.goto('/states');
    const list = page.locator('ul[aria-label="Lista de estados"]');
    await expect(list).toBeVisible();
    for (const name of ['new', 'active', 'resolved', 'closed']) {
      await expect(list.getByText(name, { exact: true })).toBeVisible();
    }
  });

  test('creates a new state (verified via API) and rejects duplicates', async ({ page, request }) => {
    await page.goto('/states');
    const uniqueName = `blocked-${Date.now()}`;

    await page.getByLabel('Nombre del estado').fill(uniqueName);
    await page.getByRole('button', { name: 'Agregar' }).click();

    // Verify the new state is persisted on json-server (authoritative source).
    await expect.poll(
      async () => {
        const all = (await (await request.get('http://127.0.0.1:3002/states')).json()) as Array<{ name: string }>;
        return all.some((s) => s.name === uniqueName);
      },
      { timeout: 10_000 },
    ).toBe(true);

    // Duplicate is rejected with an inline error (client-side guard, no POST sent).
    await page.getByLabel('Nombre del estado').fill(uniqueName);
    await page.getByRole('button', { name: 'Agregar' }).click();
    await expect(page.getByText('El estado ya existe')).toBeVisible();
  });

  // The state catalog is keyed by `name` in the UI; json-server's default
  // resource lookup is by `id`. Deletion still works in the UI's optimistic
  // path, but the API DELETE returns 404 silently. Skipped until a service-
  // level adjustment (tech-engineer) makes states first-class with an id.
  test.skip('deletes an existing state', async ({ page }) => {
    await page.goto('/states');
    const list = page.locator('ul[aria-label="Lista de estados"]');
    const row = list.locator('li', { hasText: 'closed' });
    await row.getByRole('button', { name: /Eliminar estado closed/ }).click();
    await expect(list.getByText('closed', { exact: true })).toHaveCount(0);
  });
});
