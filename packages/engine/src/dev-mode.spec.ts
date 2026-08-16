// File-scoped on purpose: tsconfig's `types` leaves node out so browser code
// cannot reach for `process` by accident, and this is the one spec that needs
// a node of its own.
/// <reference types="node" />
import { execFileSync } from 'node:child_process';
import { env, execPath } from 'node:process';
import { isDevMode } from './dev-mode';

describe('isDevMode', () => {
  afterEach(() => { vi.unstubAllEnvs(); });

  it('is true under the dev server and the spec harness', () => {
    expect(isDevMode()).toBe(true);
  });

  it('is false in a production build', () => {
    vi.stubEnv('DEV', false);
    expect(isDevMode()).toBe(false);
  });

  // The branch the shim exists for, and the only one a vitest spec cannot reach:
  // `import.meta.env` here is a proxy that answers `DEV` from `MODE` whatever is
  // stubbed or deleted, so "no Vite at all" has to be a real node without one.
  // Node runs the .ts source as-is — type stripping is on by default from 23.6,
  // and `check:versions` holds every host in this repo to the .nvmrc pin.
  describe('imported by a bare node, as the competition server will (#313)', () => {
    const moduleUrl = new URL('./dev-mode.ts', import.meta.url).href;

    const isDevModeInBareNode = (nodeEnv?: string) => execFileSync(
      execPath,
      ['--input-type=module', '-e', `import('${moduleUrl}').then(m => process.stdout.write(String(m.isDevMode())))`],
      // A key set to undefined is dropped rather than passed as "undefined", which
      // is what makes the unset case below reachable at all — vitest sets NODE_ENV.
      { env: { ...env, NODE_ENV: nodeEnv }, encoding: 'utf8' }
    );

    it('loads at all, where reading import.meta.env.DEV would throw', () => {
      expect(() => isDevModeInBareNode()).not.toThrow();
    });

    it('is false when NODE_ENV says production', () => {
      expect(isDevModeInBareNode('production')).toBe('false');
    });

    it('is true when NODE_ENV says anything else', () => {
      expect(isDevModeInBareNode('test')).toBe('true');
    });

    // A host that says nothing gets the loud behaviour rather than the quiet one.
    it('is true when NODE_ENV is unset', () => {
      expect(isDevModeInBareNode()).toBe('true');
    });
  });
});
