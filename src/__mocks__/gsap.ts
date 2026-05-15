// Jest mock for GSAP — prevents DOM animation calls from breaking jsdom tests.
/* eslint-disable @typescript-eslint/no-explicit-any */

const timelineInstance = {
  to: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  fromTo: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  add: jest.fn().mockReturnThis(),
  play: jest.fn().mockReturnThis(),
  pause: jest.fn().mockReturnThis(),
  kill: jest.fn(),
  revert: jest.fn(),
};

// Track cleanups returned by each matchMedia callback so revert() can invoke them.
const matchMediaCleanups: Array<(() => void)> = [];

const matchMediaInstance = {
  add: jest.fn((_query: string, cb: () => ((() => void) | void)) => {
    try {
      const cleanup = cb();
      if (typeof cleanup === 'function') {
        matchMediaCleanups.push(cleanup);
      }
    } catch { /* ignore */ }
  }),
  revert: jest.fn(() => {
    // Invoke all captured cleanups, then clear the list.
    matchMediaCleanups.splice(0).forEach((fn) => {
      try { fn(); } catch { /* ignore */ }
    });
  }),
};

const gsapMock: Record<string, any> = {
  to: jest.fn(),
  from: jest.fn(),
  fromTo: jest.fn(),
  set: jest.fn(),
  timeline: jest.fn(() => timelineInstance),
  matchMedia: jest.fn(() => matchMediaInstance),
  registerPlugin: jest.fn(),
  ticker: { add: jest.fn(), remove: jest.fn() },
  defaults: jest.fn(),
  utils: {
    toArray: jest.fn(() => []),
    clamp: jest.fn((min: number, max: number, v: number) => Math.min(max, Math.max(min, v))),
    mapRange: jest.fn(),
  },
  killTweensOf: jest.fn(),
  context: jest.fn(() => ({ revert: jest.fn(), kill: jest.fn() })),
};

export const gsap = gsapMock;
export default gsapMock;

// Flat re-exports so jest.requireMock('gsap').to / .from etc. resolve correctly.
// Tests that use jest.requireMock('gsap') get the ES module namespace object;
// without these, gsapMod.to would be undefined (only accessible via .default.to).
export const to = gsapMock.to as jest.Mock;
export const from = gsapMock.from as jest.Mock;
export const fromTo = gsapMock.fromTo as jest.Mock;
export const set = gsapMock.set as jest.Mock;
export const timeline = gsapMock.timeline as jest.Mock;
export const matchMedia = gsapMock.matchMedia as jest.Mock;
export const registerPlugin = gsapMock.registerPlugin as jest.Mock;
export const killTweensOf = gsapMock.killTweensOf as jest.Mock;
export const defaults = gsapMock.defaults as jest.Mock;
export const ticker = gsapMock.ticker;
export const utils = gsapMock.utils;
export const context = gsapMock.context as jest.Mock;

// Named plugin exports used via `import { ScrollTrigger } from 'gsap/ScrollTrigger'`
export const ScrollTrigger = {
  create: jest.fn(),
  refresh: jest.fn(),
  kill: jest.fn(),
};
