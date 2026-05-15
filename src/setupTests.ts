import '@testing-library/jest-dom';

// Polyfill crypto.randomUUID for jsdom (used by ToastContext)
if (typeof globalThis.crypto === 'undefined' || typeof globalThis.crypto.randomUUID === 'undefined') {
  let counter = 0;
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      randomUUID: () => `test-uuid-${++counter}-${Date.now()}`,
    },
    writable: true,
    configurable: true,
  });
}
