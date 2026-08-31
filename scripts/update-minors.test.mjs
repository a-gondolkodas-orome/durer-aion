// Only newestWithinMajor is tested, for the same reason dependency-report.test.mjs stops at
// formatReport: the rest is a network lookup and file writes. Picking the wrong version is where
// this script could quietly cross a major or drag a pin onto a prerelease.
import { describe, expect, it } from 'vitest';
import { newestWithinMajor } from './update-minors.mjs';

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
