// Jest environment bootstrap — polyfills Vite globals not available in Node/jsdom.
// Runs via jest.config.ts setupFiles (before test framework is loaded).

// Polyfill import.meta.env so httpClient.ts compiles under CommonJS.
// @ts-ignore — augmenting import.meta in a CJS context
globalThis.importMeta = { env: { VITE_API_URL: 'http://localhost:3001' } };

// Polyfill crypto.randomUUID used by ToastContext
if (typeof globalThis.crypto === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { webcrypto } = require('node:crypto');
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, writable: false });
}
