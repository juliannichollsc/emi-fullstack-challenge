// PDF Task 5 · Routing
// Verifies every documented route resolves and the 404 catch-all works.
import { test, expect } from './fixtures';

test.describe('Task 5 · Routing', () => {
  test('navigates between the documented routes', async ({ page }) => {
    await page.goto('/tasks');
    await expect(page.getByRole('heading', { name: 'Tareas', level: 2 })).toBeVisible();

    await page.getByRole('link', { name: 'Nueva', exact: true }).click();
    await expect(page).toHaveURL(/\/tasks\/new$/);
    await expect(page.getByRole('heading', { name: 'Nueva tarea' })).toBeVisible();

    await page.getByRole('link', { name: 'Estados', exact: true }).click();
    await expect(page).toHaveURL(/\/states$/);
    await expect(page.getByRole('heading', { name: 'Estados', level: 2 })).toBeVisible();

    await page.getByRole('link', { name: 'Tareas', exact: true }).click();
    await expect(page).toHaveURL(/\/tasks$/);
  });

  test('opens task detail and edit pages by id', async ({ page }) => {
    await page.goto('/tasks/1');
    await expect(page.getByRole('heading', { name: 'Complete Project Proposal' })).toBeVisible();

    await page.getByRole('link', { name: /Editar/ }).first().click();
    await expect(page).toHaveURL(/\/tasks\/1\/edit$/);
    await expect(page.getByLabel('Título')).toHaveValue('Complete Project Proposal');
  });

  test('unknown path renders the 404 catch-all', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');
    await expect(page.getByRole('heading', { name: /Página no encontrada/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Ir a tareas/ })).toBeVisible();
  });
});
