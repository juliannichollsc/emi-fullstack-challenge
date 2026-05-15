// PDF Task 2 · Task Component
// Each card must show title, description, dueDate, last stateHistory entry, notes,
// and expose edit + delete actions.
import { test, expect } from './fixtures';

test.describe('Task 2 · Task Component', () => {
  test('first task card exposes all PDF-mandated fields', async ({ page }) => {
    await page.goto('/tasks');
    const grid = page.locator('ul[aria-label="Lista de tareas"]');
    await expect(grid).toBeVisible();
    const firstCard = grid.locator('> li').first();

    // Title (seed[0])
    await expect(firstCard.getByRole('heading', { name: 'Complete Project Proposal' })).toBeVisible();
    // Description
    await expect(firstCard.getByText(/Prepare and submit the project proposal/)).toBeVisible();
    // Due date (seed)
    await expect(firstCard.locator('time[datetime="2023-12-15"]')).toBeVisible();
    // Last state in seed = "active" → displayed label is "Activo"
    await expect(firstCard.getByText('Activo', { exact: true })).toBeVisible();
    // At least one note bullet
    await expect(firstCard.getByText('Check proposal guidelines')).toBeVisible();
    // Edit + delete actions
    await expect(firstCard.getByRole('link', { name: /Editar/ })).toBeVisible();
    await expect(firstCard.getByRole('button', { name: /Eliminar/ })).toBeVisible();
  });

  test('card is reusable — every visible card has the same structure', async ({ page }) => {
    await page.goto('/tasks');
    const cards = page.locator('ul[aria-label="Lista de tareas"] > li');
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      const c = cards.nth(i);
      await expect(c.getByRole('checkbox')).toBeVisible();
      await expect(c.locator('time').first()).toBeVisible();
      await expect(c.getByRole('link', { name: /Editar/ })).toBeVisible();
      await expect(c.getByRole('button', { name: /Eliminar/ })).toBeVisible();
    }
  });
});
