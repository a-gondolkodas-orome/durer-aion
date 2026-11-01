// Only the pure helpers are tested, for the same reason dependency-report.test.mjs stops at
// formatReport: the rest is a network lookup and file writes. Picking the wrong version is where
// this script could quietly cross a major or drag a pin onto a prerelease; missing an override is
// where it leaves a duplicate install behind.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { newestWithinMajor, overriddenPackages } from './update-minors.mjs';

describe('newestWithinMajor', () => {
  it('picks the newest release of the pinned major, comparing numerically', () => {
    expect(newestWithinMajor(['8.2.1', '8.2.2', '8.10.0', '8.9.9'], '8.2.1')).toBe('8.10.0');
  });

  it('never crosses the pinned major', () => {
    expect(newestWithinMajor(['8.2.1', '9.0.0', '10.1.2'], '8.2.1')).toBe('8.2.1');
  });

  it('treats a 0.x major like any other', () => {
    expect(newestWithinMajor(['0.50.2', '0.51.0', '1.0.0'], '0.50.2')).toBe('0.51.0');
  });

  it('skips prereleases even when they are newer', () => {
    expect(newestWithinMajor(['8.2.1', '8.3.0-beta.1'], '8.2.1')).toBe('8.2.1');
  });

  it('answers undefined for a pin that is not an exact stable version', () => {
    expect(newestWithinMajor(['8.2.1'], '^8.2.1')).toBeUndefined();
    expect(newestWithinMajor(['8.2.1'], '8.2.1-rc.1')).toBeUndefined();
  });
});

describe('overriddenPackages', () => {
  it('names the package each override forces, however deep it is nested', () => {
    expect(overriddenPackages({
      'koa-socket-2': { 'socket.io': '^4' },
      foo: '1.2.3',
      bar: { '.': '2.0.0', baz: { qux: '^3' } }
    })).toStrictEqual(['socket.io', 'foo', 'bar', 'qux']);
  });

  it('leaves out a $ reference, which follows the root pin already', () => {
    expect(overriddenPackages({ foo: '$foo', bar: { '.': '$bar', baz: '$baz' } })).toStrictEqual([]);
  });

  it('finds socket.io in the root package.json, where the duplicate install comes from', () => {
    const { overrides } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    expect(overriddenPackages(overrides)).toContain('socket.io');
  });
});
