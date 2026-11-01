// The registry lookups are not tested, for the reason dependency-report.test.mjs gives. What is left
// is the part that decides which version a sweep proposes: reading the window from .npmrc, and
// picking the newest release npm will actually install.
import { describe, expect, it } from 'vitest';
import { matureVersions, newestMature, parseMinReleaseAge } from './release-age.mjs';

const DAY = 24 * 60 * 60 * 1000;
const now = Date.parse('2026-11-01T12:00:00Z');
const ago = days => new Date(now - days * DAY).toISOString();

describe('parseMinReleaseAge', () => {
  it('reads the number of days', () => {
    expect(parseMinReleaseAge('save-exact=true\nmin-release-age = 7\n')).toBe(7);
  });

  it('is 0 when unset or commented out', () => {
    expect(parseMinReleaseAge('save-exact=true\n')).toBe(0);
    expect(parseMinReleaseAge('# min-release-age=7\n')).toBe(0);
  });

  // `min-release-age-exclude[]=…` shares the prefix and must not be read as the window.
  it('does not mistake the exclude list for the window', () => {
    expect(parseMinReleaseAge('min-release-age-exclude[]=foo\nmin-release-age=3\n')).toBe(3);
  });
});

describe('matureVersions', () => {
  const time = { created: ago(900), modified: ago(1), '8.3.4': ago(10), '8.3.5': ago(2), '9.0.0-beta.1': ago(30), '8.3.3': ago(7) };

  it('keeps stable versions at least the window old, and drops the created/modified keys', () => {
    expect(matureVersions(time, 7, now).sort()).toEqual(['8.3.3', '8.3.4']);
  });

  it('keeps every stable version when the window is 0', () => {
    expect(matureVersions(time, 0, now).sort()).toEqual(['8.3.3', '8.3.4', '8.3.5']);
  });
});

describe('newestMature', () => {
  it('answers the dist-tag when it is old enough', () => {
    expect(newestMature({ current: '8.1.0', distLatest: '8.3.5', mature: ['8.1.0', '8.3.5'] }))
      .toEqual({ latest: '8.3.5' });
  });

  it('falls back to the newest old-enough release below a too-new dist-tag', () => {
    expect(newestMature({ current: '8.1.0', distLatest: '8.3.5', mature: ['8.1.0', '8.3.4', '8.10.0-rc.1'] }))
      .toEqual({ latest: '8.3.4', cooling: '8.3.5' });
  });

  // A backport to an older major can be published after the latest of the newest one; the report
  // compares against `latest`, so a newer major's version must not be offered above it.
  it('compares by version, not by publish order, and never above the dist-tag', () => {
    expect(newestMature({ current: '8.1.0', distLatest: '8.3.5', mature: ['8.1.0', '7.9.9', '8.3.0', '9.0.0'] }))
      .toEqual({ latest: '8.3.0', cooling: '8.3.5' });
  });

  // A pin taken on purpose inside the window, such as a security fix, is not behind anything.
  it('never offers a version below the current pin', () => {
    expect(newestMature({ current: '8.3.5', distLatest: '8.3.5', mature: ['8.3.4'] }))
      .toEqual({ latest: '8.3.5', cooling: '8.3.5' });
    expect(newestMature({ current: '8.3.5', distLatest: '8.3.6', mature: ['8.3.4'] }))
      .toEqual({ latest: '8.3.5', cooling: '8.3.6' });
  });
});
