import { describe, expect, it } from 'vitest';
import { findResolved } from './resolved-versions.mjs';

const lockfile = packages => ({ packages });

describe('findResolved', () => {
  it('reads a hoisted dependency from the root of the tree', () => {
    expect(findResolved(lockfile({ 'node_modules/playwright': { version: '1.62.1' } }), 'playwright'))
      .toBe('1.62.1');
  });

  it('reads one npm nested under this workspace', () => {
    expect(findResolved(lockfile({ 'apps/strategy-practice/node_modules/vite': { version: '8.2.1' } }), 'vite'))
      .toBe('8.2.1');
  });

  // The case that decides which lookup comes first: npm nests a version here precisely when the
  // hoisted one is somebody else's, so the nested copy is the one this app resolves. Preferring
  // the root would report the other workspace's version as if it were ours.
  it('prefers the nested copy when a package is in both places', () => {
    const both = lockfile({
      'node_modules/typescript': { version: '5.9.3' },
      'apps/strategy-practice/node_modules/typescript': { version: '6.0.3' }
    });

    expect(findResolved(both, 'typescript')).toBe('6.0.3');
  });

  it('handles scoped names', () => {
    expect(findResolved(lockfile({ 'node_modules/@testing-library/react': { version: '16.3.2' } }), '@testing-library/react'))
      .toBe('16.3.2');
  });

  // Callers distinguish "not installed" from a version, so this must be undefined rather than a
  // throw or an empty string: check-versions reports it as a missing source, the report falls back.
  it('is undefined for a package the lockfile does not mention', () => {
    expect(findResolved(lockfile({ 'node_modules/vite': { version: '8.2.1' } }), 'rollup')).toBeUndefined();
  });

  it('is undefined when there is no lockfile at all', () => {
    expect(findResolved(null, 'vite')).toBeUndefined();
  });
});
