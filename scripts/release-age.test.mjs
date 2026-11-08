// The registry lookups are not tested, for the reason dependency-report.test.mjs gives. What is left
// is the part that decides which version a sweep proposes: reading the window from .npmrc,
// picking the newest release npm will actually install, and never crossing a major.
import { matureVersions, newestMature, newestWithinMajor, parseMinReleaseAge } from './release-age.mjs';

const DAY = 24 * 60 * 60 * 1000;
const now = Date.parse('2026-11-01T12:00:00Z');
const ago = days => new Date(now - days * DAY).toISOString();

it('parseMinReleaseAge reads the window, and 0 when it is unset or commented out', () => {
  // `min-release-age-exclude[]=…` shares the prefix and must not be read as the window.
  expect(parseMinReleaseAge('min-release-age-exclude[]=foo\nmin-release-age = 7\n')).toBe(7);
  expect(parseMinReleaseAge('save-exact=true\n# min-release-age=7\n')).toBe(0);
});

it('matureVersions keeps stable versions at least the window old, and no other key of `time`', () => {
  const time = { created: ago(900), modified: ago(1), '8.3.4': ago(10), '8.3.5': ago(2), '9.0.0-beta.1': ago(30), '8.3.3': ago(7) };

  expect(matureVersions(time, 7, now).sort()).toEqual(['8.3.3', '8.3.4']);
  expect(matureVersions(time, 0, now).sort()).toEqual(['8.3.3', '8.3.4', '8.3.5']);
});

it('newestMature answers the dist-tag when old enough, else the newest old-enough version below it', () => {
  expect(newestMature({ current: '8.1.0', distLatest: '8.3.5', mature: ['8.1.0', '8.3.5'] }))
    .toBe('8.3.5');
  // By version, not by publish order: a backport to an older major, or a newer major, published
  // after the dist-tag is not offered above it.
  expect(newestMature({ current: '8.1.0', distLatest: '8.3.5', mature: ['8.1.0', '7.9.9', '8.3.0', '9.0.0', '8.10.0-rc.1'] }))
    .toBe('8.3.0');
});

// A pin taken on purpose inside the window, such as a security fix, is not behind anything.
it('newestMature never offers a version below the current pin', () => {
  expect(newestMature({ current: '8.3.5', distLatest: '8.3.6', mature: ['8.3.4'] }))
    .toBe('8.3.5');
});

// Picking the wrong version is where `update:minors` could quietly cross a major or drag a pin onto
// a prerelease.
it('newestWithinMajor picks the newest stable release of the pinned major, numerically', () => {
  expect(newestWithinMajor(['8.2.1', '8.10.0', '8.9.9', '9.0.0', '8.11.0-beta.1'], '8.2.1')).toBe('8.10.0');
  expect(newestWithinMajor(['0.50.2', '0.51.0', '1.0.0'], '0.50.2')).toBe('0.51.0');
});

it('newestWithinMajor answers undefined for a pin that is not an exact stable version', () => {
  expect(newestWithinMajor(['8.2.1'], '^8.2.1')).toBeUndefined();
  expect(newestWithinMajor(['8.2.1'], '8.2.1-rc.1')).toBeUndefined();
});
