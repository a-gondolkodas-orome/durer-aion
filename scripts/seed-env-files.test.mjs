// Only missingKeys is tested, for the same reason update-minors.test.mjs stops at
// newestWithinMajor: the rest is directory scanning and file copies. What could go
// wrong here is reporting the wrong thing — a value difference a developer means to
// have, or a key they added themselves — which is what would train someone to stop
// reading the output.
import { describe, expect, it } from 'vitest';
import { missingKeys } from './seed-env-files.mjs';

describe('missingKeys', () => {
  it('names a setting the sample has and the file does not', () => {
    expect(missingKeys('A=1\nB=2\n', 'A=1\n')).toEqual(['B']);
  });

  it('says nothing when only the values differ', () => {
    expect(missingKeys('ADMIN_CREDENTIALS=admin\n', 'ADMIN_CREDENTIALS=real_one\n')).toEqual([]);
  });

  it('ignores a key the developer added that the sample never had', () => {
    expect(missingKeys('A=1\n', 'A=1\nWEB_PORT=8080\n')).toEqual([]);
  });

  it('counts a key with an empty value as present', () => {
    expect(missingKeys('VITE_SENTRY_DSN=\n', 'VITE_SENTRY_DSN=\n')).toEqual([]);
  });

  it('skips comments and blank lines rather than reading them as keys', () => {
    const sample = '#a comment with = in it\n\n  \nA=1\n';
    expect(missingKeys(sample, 'A=1\n')).toEqual([]);
    expect(missingKeys(sample, '')).toEqual(['A']);
  });

  it('reads the `export KEY=value` spelling as that key', () => {
    expect(missingKeys('export A=1\n', 'A=1\n')).toEqual([]);
    expect(missingKeys('A=1\n', 'export A=1\n')).toEqual([]);
  });

  it('tolerates a missing trailing newline and surrounding whitespace', () => {
    expect(missingKeys('A=1', '  A=1  ')).toEqual([]);
  });

  it('reports nothing for identical files', () => {
    const text = "VITE_S3_BUCKET_NAME='aaa'\n\n#comment\nVITE_SENTRY_DSN=\n";
    expect(missingKeys(text, text)).toEqual([]);
  });
});
