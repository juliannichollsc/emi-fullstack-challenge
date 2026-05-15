// PDF Task 4 · TaskForm
// All fields required + at least one non-empty note. Valid submit creates the task.
import { test, expect } from './fixtures';

test.describe('Task 4 · TaskForm validation', () => {
  test('blocks submit when fields are empty and shows inline errors', async ({ page }) => {
    await page.goto('/tasks/new');
    await page.getByRole('button', { name: /Crear tarea/ }).click();

    // Errors are inline alerts under each field.
    await expect(page.getByText('El título es requerido')).toBeVisible();
    await expect(page.getByText('La descripción es requerida')).toBeVisible();
    await expect(page.getByText('La fecha límite es requerida')).toBeVisible();
    await expect(page.getByText('Se requiere al menos una nota')).toBeVisible();
    await expect(page).toHaveURL(/\/tasks\/new$/);
  });

  test('valid submit creates a task and redirects to a detail URL', async ({ page, request }) => {
    const title = `E2E spec ${Date.now()}`;
    await page.goto('/tasks/new');

    await page.getByLabel('Título').fill(title);
    await page.getByLabel('Descripción').fill('Created during Task 4 e2e.');
    await page.getByLabel('Fecha límite').fill('2026-12-31');
    await page.getByLabel('Estado inicial').selectOption('active');
    await page.getByRole('textbox', { name: 'Nota 1' }).fill('Primera nota');
    await page.getByRole('button', { name: /Crear tarea/ }).click();

    // App may use crypto UUIDs for new ids. Accept any non-empty path segment.
    await page.waitForURL(/\/tasks\/[^/]+$/);

    // Verify persistence directly against json-server (more deterministic than the SPA list,
    // which is paginated and may not include the newly created entry on page 1).
    const all = await (await request.get('http://127.0.0.1:3002/tasks')).json();
    expect(all.some((t: { title: string }) => t.title === title)).toBe(true);
  });

  test('dynamic notes — add and remove inputs', async ({ page }) => {
    await page.goto('/tasks/new');
    await expect(page.getByRole('textbox', { name: 'Nota 1' })).toBeVisible();

    await page.getByRole('button', { name: 'Agregar nota' }).click();
    await expect(page.getByRole('textbox', { name: 'Nota 2' })).toBeVisible();

    await page.getByRole('button', { name: 'Eliminar nota 2' }).click();
    await expect(page.getByRole('textbox', { name: 'Nota 2' })).toHaveCount(0);
  });
});
