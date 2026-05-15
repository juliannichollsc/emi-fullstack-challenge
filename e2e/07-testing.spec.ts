// PDF Task 7 · Testing
// Task 7 is owned by jest-tester for unit tests. This e2e spec is a cross-cutting smoke
// covering the full CRUD lifecycle in the browser, so a regression anywhere lights up here.
import { test, expect } from './fixtures';

test.describe('Task 7 · CRUD smoke (cross-cutting)', () => {
  test('create → toggle complete → delete (uses existing seed task)', async ({ page, request }) => {
    // Use an existing seed task to avoid pagination/cache races on freshly created ones.
    const target = page
      .locator('ul[aria-label="Lista de tareas"] > li')
      .filter({ has: page.getByRole('heading', { name: 'Bug Fixes and Testing' }) });

    await page.goto('/tasks');

    // Toggle complete.
    await target.getByRole('checkbox').click();
    await expect(target.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');

    // Server-side verification.
    const afterToggle = await (await request.get('http://127.0.0.1:3002/tasks/5')).json();
    expect(afterToggle.completed).toBe(true);

    // Delete.
    page.once('dialog', (d) => d.accept());
    await target.getByRole('button', { name: /Eliminar/ }).click();
    await expect(page.getByRole('heading', { name: 'Bug Fixes and Testing' })).toHaveCount(0);

    const afterDelete = await request.get('http://127.0.0.1:3002/tasks/5');
    expect(afterDelete.status()).toBe(404);
  });
});
