// Whether to fail loudly. The engine and the games throw on a bug in dev and
// warn in prod (src/components/CLAUDE.md § moves); this is the one place that
// decides which of the two a given host is.
//
// `import.meta.env` is Vite's, and it is undefined anywhere Vite did not build
// the code — a bare `node` run, a spec harness, or the competition server that
// issue #313 hands these modules to, where reading `.DEV` off it would throw
// before the game logic ever ran. Node's own convention decides there instead,
// defaulting to dev so a host that says nothing still gets the loud behaviour.
type NodeGlobal = { process?: { env?: Record<string, string | undefined> } };

export const isDevMode = (): boolean => {
  // Read on every call, and written out **exactly** like this. Vite substitutes
  // this expression, and it matches on the shape: hoisting it to module scope
  // pins whichever value was current at import time (and makes
  // `vi.stubEnv('DEV', …)` a no-op), while so much as a type assertion around
  // `import.meta` stops the substitution altogether — which fails silently, as
  // every host then looks like a host with no Vite. `vite/client` types it,
  // which is why the tsconfig references them.
  const viteDev: boolean | undefined = import.meta.env?.DEV;
  if (viteDev !== undefined) return viteDev;
  return (globalThis as NodeGlobal).process?.env?.NODE_ENV !== 'production';
};
