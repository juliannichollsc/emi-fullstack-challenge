// PDF Task 8 · Error Handling
// When the API returns 500, the list surfaces an error UI with role="alert".
import { test, expect } from './fixtures';

test.describe('Task 8 · Error handling', () => {
  test('500 from /tasks shows the error panel', async ({ page }) => {
    // Intercept ONLY the API host (json-server on 3002), not the SPA route on 5174.
    await page.route('http://127.0.0.1:3002/tasks**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'forced failure' }),
        });
        return;
      }
      await route.fallback();
    });

    await page.goto('/tasks');
    // Scope to main — there's also a toast alert in the viewport for the same error.
    await expect(page.locator('#main-content').getByRole('alert')).toBeVisible();
  });

  test('unknown task id shows a friendly fallback, not a crash', async ({ page }) => {
    await page.goto('/tasks/this-id-does-not-exist');
    await expect(page.getByText(/Tarea no encontrada/)).toBeVisible();
    await expect(page.getByRole('link', { name: /Volver a tareas/ })).toBeVisible();
  });
});
