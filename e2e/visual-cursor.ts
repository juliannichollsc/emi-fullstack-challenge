import type { Page } from '@playwright/test';

/**
 * Injects a red-dot cursor overlay that follows Playwright's synthetic mouse events.
 *
 * Playwright drives the page via CDP — the OS cursor never moves. This overlay
 * watches `mousemove` / `mousedown` (which CDP DOES dispatch to the DOM) and
 * paints a visible dot at the event coordinates. Useful for demos / presentations
 * in slow mode; not needed for CI.
 *
 * Activate by passing every Page through `installVisualCursor(page)` before
 * any navigation, or set VISUAL_CURSOR=1 to let the fixture do it for you.
 */
export async function installVisualCursor(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const ID = '__pw_visual_cursor__';

    function ensure(): HTMLDivElement | null {
      const existing = document.getElementById(ID) as HTMLDivElement | null;
      if (existing) return existing;
      const root = document.documentElement;
      if (!root) return null;
      const dot = document.createElement('div');
      dot.id = ID;
      dot.setAttribute('aria-hidden', 'true');
      dot.style.cssText = [
        'position: fixed',
        'top: 0',
        'left: 0',
        'width: 22px',
        'height: 22px',
        'border-radius: 50%',
        'background: rgba(220, 38, 38, 0.85)',
        'border: 2px solid white',
        'box-shadow: 0 0 14px rgba(220, 38, 38, 0.75), 0 2px 6px rgba(0,0,0,0.35)',
        'pointer-events: none',
        'z-index: 2147483647',
        'transform: translate(-50%, -50%)',
        'transition: background-color 120ms ease-out, width 120ms ease-out, height 120ms ease-out',
        'will-change: transform',
      ].join(';');
      root.appendChild(dot);
      return dot;
    }

    let lastX = 0;
    let lastY = 0;
    function move(x: number, y: number) {
      lastX = x;
      lastY = y;
      const dot = ensure();
      if (dot) dot.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    }

    function pulse() {
      const dot = ensure();
      if (!dot) return;
      dot.style.background = 'rgba(250, 204, 21, 0.95)';
      dot.style.width = '34px';
      dot.style.height = '34px';
      window.setTimeout(() => {
        dot.style.background = 'rgba(220, 38, 38, 0.85)';
        dot.style.width = '22px';
        dot.style.height = '22px';
      }, 220);
    }

    // Late-attach the dot once the document body exists.
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => ensure(), { once: true });
    } else {
      ensure();
    }

    // Capture-phase, passive — never interferes with the page's own handlers.
    window.addEventListener('mousemove', (e) => move(e.clientX, e.clientY), { capture: true, passive: true });
    window.addEventListener('mousedown', () => pulse(), { capture: true, passive: true });

    // Also follow keyboard focus jumps so it doesn't get "stranded" off-screen
    // when the test types without first moving the mouse.
    document.addEventListener('focusin', (e) => {
      const t = e.target as Element | null;
      if (!t || !(t instanceof HTMLElement)) return;
      const r = t.getBoundingClientRect();
      if (r.width || r.height) move(r.left + r.width / 2, r.top + r.height / 2);
    }, { capture: true, passive: true });
  });
}
