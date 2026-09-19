// The directory scanning and the file copies are left untested, for the same reason
// update-minors.test.mjs stops at newestWithinMajor. What could go wrong here is
// reporting the wrong thing — a value difference a developer means to have, or a key
// they added themselves — which is what would train someone to stop reading the
// output, and what `--check` counts as reason to stop a deployment.
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { DEPLOYED_STACK_READS, checkFailed, missingKeys } from './seed-env-files.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

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

describe('checkFailed', () => {
  // The bug this pins: the first version of `--check` stopped a deployment for a file
  // that was not there and waved through one that existed without a key the sample had
  // gained. Both build the same bundle, with the value inlined as undefined, and the
  // second is the one `git pull && npm run stack:prod` actually meets.
  it('stops for a file that exists but has fallen behind', () => {
    const behind = [{ target: '.env.docker', sample: '.env.docker.sample', missing: ['A'] }];
    expect(checkFailed({ absent: [], behind })).toBe(true);
  });

  it('stops for a file that is not there', () => {
    const absent = [{ target: '.env.local', sample: '.env.local.sample' }];
    expect(checkFailed({ absent, behind: [] })).toBe(true);
  });

  it('lets a run through when it found neither', () => {
    expect(checkFailed({ absent: [], behind: [] })).toBe(false);
  });
});

describe('DEPLOYED_STACK_READS', () => {
  // A typo here does not fail anything by itself: the entry simply matches no target,
  // and `--check` quietly stops asking about that file. So the names are pinned against
  // the samples on disk, which is what the script derives every target from.
  it.each(DEPLOYED_STACK_READS)('%s is a file this repo has a sample for', (target) => {
    expect(existsSync(join(repoRoot, `${target}.sample`))).toBe(true);
  });

  it('is the set the stack:prod path reads, and no more', () => {
    expect(DEPLOYED_STACK_READS).toStrictEqual([
      '.env.docker',
      '.env.local',
      join('apps', 'online-frontend', '.env'),
    ]);
  });
});
