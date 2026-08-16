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
  // Read on every call, and written out in full: Vite replaces this exact
  // expression at build time, and `vi.stubEnv('DEV', …)` mutates the object a
  // spec is already running against, so hoisting it to module scope would pin
  // whichever value happened to be current when the module first loaded.
  const viteDev: boolean | undefined = import.meta.env?.DEV;
  if (viteDev !== undefined) return viteDev;
  return (globalThis as NodeGlobal).process?.env?.NODE_ENV !== 'production';
};
