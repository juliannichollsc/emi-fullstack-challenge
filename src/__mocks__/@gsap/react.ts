// Jest mock for @gsap/react — useGSAP no-ops in jsdom.
export const useGSAP = jest.fn(
  (cb: () => (() => void) | void) => {
    try { cb(); } catch { /* ignore */ }
  },
);
