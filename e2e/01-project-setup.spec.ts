// PDF Task 1 · Project Setup
// Verifies the app boots, root redirects to /tasks, and the EMI header is present.
import { test, expect } from './fixtures';

test.describe('Task 1 · Project Setup', () => {
  test('root URL redirects to /tasks and shell renders', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('**/tasks');
    await expect(page).toHaveURL(/\/tasks$/);
    await expect(page.getByRole('heading', { name: 'Tareas', level: 2 })).toBeVisible();
  });

  test('top-level layout has EMI brand and primary nav', async ({ page }) => {
    await page.goto('/tasks');
    await expect(page.getByRole('link', { name: /Task Manager/i }).first()).toBeVisible();
    // Desktop nav is hidden < md, but the test viewport (Desktop Chrome) is wide enough.
    await expect(page.getByRole('link', { name: 'Tareas', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Nueva', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Estados', exact: true })).toBeVisible();
  });
});
