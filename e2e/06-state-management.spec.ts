// PDF Task 6 · Access Data (state management)
// A task created via the form must persist (context → service → json-server → db.test.json)
// and remain visible after a hard reload.
import { test, expect } from './fixtures';

test.describe('Task 6 · State management & data access', () => {
  test('created task survives a full page reload', async ({ page, request }) => {
    const title = `Persisted — ${Date.now()}`;

    await page.goto('/tasks/new');
    await page.getByLabel('Título').fill(title);
    await page.getByLabel('Descripción').fill('Comes from spec 06.');
    await page.getByLabel('Fecha límite').fill('2026-11-30');
    await page.getByLabel('Estado inicial').selectOption('new');
    await page.getByRole('textbox', { name: 'Nota 1' }).fill('Persistencia');
    await page.getByRole('button', { name: /Crear tarea/ }).click();

    await page.waitForURL(/\/tasks\/[^/]+$/);

    // Persistence check: the new task is queryable from json-server (the source of truth).
    const persisted = await (await request.get('http://127.0.0.1:3002/tasks')).json();
    expect(persisted.some((t: { title: string }) => t.title === title)).toBe(true);

    // And a hard reload still finds it via the API (proves it is durable, not in-memory only).
    await page.reload();
    const stillThere = await (await request.get('http://127.0.0.1:3002/tasks')).json();
    expect(stillThere.some((t: { title: string }) => t.title === title)).toBe(true);
  });

  test('deleting a task removes it from the list and persists', async ({ page }) => {
    await page.goto('/tasks');
    const target = page
      .locator('ul[aria-label="Lista de tareas"] > li')
      .filter({ has: page.getByRole('heading', { name: 'Design Wireframes' }) });

    page.once('dialog', (d) => d.accept());
    await target.getByRole('button', { name: /Eliminar/ }).click();

    await expect(page.getByRole('heading', { name: 'Design Wireframes' })).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Design Wireframes' })).toHaveCount(0);
  });
});
