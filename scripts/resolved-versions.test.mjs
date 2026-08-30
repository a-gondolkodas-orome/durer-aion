import { describe, expect, it } from 'vitest';
import { findResolved, findWorkspaceLink } from './resolved-versions.mjs';

const lockfile = packages => ({ packages });
const practice = 'apps/strategy-practice';

describe('findResolved', () => {
  it('reads a hoisted dependency from the root of the tree', () => {
    expect(findResolved(lockfile({ 'node_modules/playwright': { version: '1.62.1' } }), 'playwright', practice))
      .toBe('1.62.1');
  });

  it('reads one npm nested under the workspace asking', () => {
    expect(findResolved(lockfile({ 'apps/strategy-practice/node_modules/vite': { version: '8.2.1' } }), 'vite', practice))
      .toBe('8.2.1');
  });

  // The case that decides which lookup comes first: npm nests a version here precisely when the
  // hoisted one is somebody else's, so the nested copy is the one that workspace resolves.
  // Preferring the root would report another workspace's version as if it were this one's.
  it('prefers the nested copy when a package is in both places', () => {
    const both = lockfile({
      'node_modules/typescript': { version: '5.9.3' },
      'apps/strategy-practice/node_modules/typescript': { version: '6.0.3' }
    });

    expect(findResolved(both, 'typescript', practice)).toBe('6.0.3');
  });

  it('handles scoped names', () => {
    expect(findResolved(lockfile({ 'node_modules/@testing-library/react': { version: '16.3.2' } }), '@testing-library/react', practice))
      .toBe('16.3.2');
  });

  // Callers distinguish "not installed" from a version, so this must be undefined rather than a
  // throw or an empty string: check-versions reports it as a missing source, the report falls back.
  it('is undefined for a package the lockfile does not mention', () => {
    expect(findResolved(lockfile({ 'node_modules/vite': { version: '8.2.1' } }), 'rollup', practice)).toBeUndefined();
  });

  it('is undefined when there is no lockfile at all', () => {
    expect(findResolved(null, 'vite', practice)).toBeUndefined();
  });
});

describe('findWorkspaceLink', () => {
  // What npm writes for a workspace dependency: the directory it points at, and no version.
  const link = { resolved: 'packages/engine', link: true };

  it('recognises a workspace linked into the root of the tree', () => {
    expect(findWorkspaceLink(lockfile({ 'node_modules/engine': link }), 'engine', practice)).toBe(true);
  });

  it('recognises one linked under the workspace asking', () => {
    expect(findWorkspaceLink(lockfile({ 'apps/strategy-practice/node_modules/engine': link }), 'engine', practice)).toBe(true);
  });

  it('is false for a package installed from the registry', () => {
    expect(findWorkspaceLink(lockfile({ 'node_modules/vite': { version: '8.2.1' } }), 'vite', practice)).toBe(false);
  });

  it('is false for a package the lockfile does not mention', () => {
    expect(findWorkspaceLink(lockfile({}), 'engine', practice)).toBe(false);
  });

  // Without a lockfile the report falls back to declared ranges, and `"engine": "*"` would be
  // reported against a stranger's package. Nothing is claimed to be a workspace on no evidence,
  // so the caller keeps the row — a wrong row is visible, a silently dropped one is not.
  it('is false when there is no lockfile at all', () => {
    expect(findWorkspaceLink(null, 'engine', practice)).toBe(false);
  });
});

// The root package.json is a workspace like the others here, and asks with no directory of its
// own: only the hoisted copy is its.
describe('a lookup for the root package', () => {
  const both = lockfile({
    'node_modules/typescript': { version: '5.9.3' },
    'apps/strategy-practice/node_modules/typescript': { version: '6.0.3' }
  });

  it('reads the hoisted version, not another workspace\'s nested one', () => {
    expect(findResolved(both, 'typescript')).toBe('5.9.3');
  });
});
