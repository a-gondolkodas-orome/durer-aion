/*
Deterministic `Math.random` under test, so the randomised suites replay: the
seed is derived per test, and `VITEST_SEED` varies it across runs. Installed by
a call from each setup file rather than by an import side effect —
apps/strategy-practice sets `isolate: false`, where a hook registered at a
module's top level reaches only the first spec file in each worker.
*/
import { beforeEach, expect } from 'vitest';

// Off globalThis, not a bare `process`: apps/strategy-practice typechecks its
// setup file and follows this import, without node types.
const RUN_SEED = (globalThis as { process?: { env?: Record<string, string | undefined> } })
  .process?.env?.VITEST_SEED ?? '1';

// mulberry32
const mulberry32 = (seed: number) => {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// FNV-1a, to fold the seed's parts into the one word mulberry32 takes.
const hash = (text: string) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
};

const seedFrom = (...parts: string[]) => mulberry32(hash([RUN_SEED, ...parts].join('\n')));

export const installSeededRandom = () => {
  // Assigned, not spied: apps/strategy-practice sets `restoreMocks`.
  Math.random = seedFrom(expect.getState().testPath ?? '', 'module scope');

  beforeEach(() => {
    const { testPath, currentTestName } = expect.getState();
    Math.random = seedFrom(testPath ?? '', currentTestName ?? '');
  });
};
