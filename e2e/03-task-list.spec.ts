// PDF Task 3 · TaskList
// Pagination at 5/page from db.json, and the user can mark a task as completed.
import { test, expect } from './fixtures';

test.describe('Task 3 · TaskList', () => {
  test('paginates at 5 tasks per page', async ({ page }) => {
    await page.goto('/tasks');
    const cards = page.locator('ul[aria-label="Lista de tareas"] > li');
    await expect(cards).toHaveCount(5);

    // Seed has 6 tasks → page 2 exists with 1 card.
    await page.getByRole('button', { name: /Ir a página 2/ }).click();
    await expect(cards).toHaveCount(1);
  });

  test('marking a task completed persists across reload', async ({ page }) => {
    await page.goto('/tasks');
    const grid = page.locator('ul[aria-label="Lista de tareas"]');
    const firstCard = grid.locator('> li').first();
    const checkbox = firstCard.getByRole('checkbox');

    await expect(checkbox).toHaveAttribute('aria-checked', 'false');
    await checkbox.click();
    await expect(checkbox).toHaveAttribute('aria-checked', 'true');

    await page.reload();
    const firstAfterReload = page.locator('ul[aria-label="Lista de tareas"] > li').first();
    await expect(firstAfterReload.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');
  });
});
