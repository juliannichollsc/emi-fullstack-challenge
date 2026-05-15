// PDF Task 10 · Responsive
// Iterate viewports and assert: hamburger visible on mobile, desktop nav visible on md+,
// the list reflows without horizontal overflow.
import { test, expect } from './fixtures';

const VIEWPORTS = [
  { name: 'mobile',  width: 375, height: 720 },
  { name: 'tablet',  width: 768, height: 900 },
  { name: 'desktop', width: 1280, height: 800 },
];

test.describe('Task 10 · Responsive', () => {
  for (const vp of VIEWPORTS) {
    test(`renders correctly at ${vp.name} (${vp.width}×${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/tasks');

      await expect(page.getByRole('heading', { name: 'Tareas', level: 2 })).toBeVisible();

      const hamburger = page.getByRole('button', { name: /Abrir menú/ });
      const desktopTareasNav = page.getByRole('link', { name: 'Tareas', exact: true });

      if (vp.width < 768) {
        await expect(hamburger).toBeVisible();
      } else {
        await expect(desktopTareasNav).toBeVisible();
      }

      // No horizontal scroll on the document at any viewport.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }
});
