// What a sync must do is all plain git, and none of it was reachable while it lived as shell
// inside .github/workflows/sync.yml — the workflow's secrets hold one value, so the only way to
// run it was against the real private repository. Between two bare repos in a temp directory it
// costs nothing, and the properties below are the ones the arrangement exists for: the year's
// unreleased game is not deleted by a sync, and nothing ever travels back to the public repo.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { MERGE_MESSAGE, assertSyncBranch, syncBranch, writeAskpass } from './sync-mirror.mjs';

const REF = 'sync-2026';

describe('assertSyncBranch', () => {
  it.each(['sync-2026', 'sync-a', 'sync-my.branch_v2', 'sync-19OCD'])('accepts %s', ref => {
    expect(assertSyncBranch(ref)).toBe(ref);
  });

  // The name is spent on git commands run with the mirror's PAT in scope. Nothing runs through a
  // shell, so what is left to refuse is a name git would read as an option or as a second path.
  it.each([
    ['a branch that is not a sync branch', 'main'],
    ['the prefix with nothing after it', 'sync-'],
    ['a name carrying a shell separator', 'sync-a;rm -rf /'],
    ['a name with a space in it', 'sync-a b'],
    ['a git option', '--upload-pack=touch /tmp/pwned'],
    ['an empty ref', ''],
  ])('refuses %s', (_name, ref) => {
    expect(() => assertSyncBranch(ref)).toThrow(/not a sync-<name> branch/);
  });
});

// Two bare repositories standing in for the public repo and the year's private mirror, and a
// working clone of each to put commits into them with.
const scenarios = [];

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

const commit = (dir, files, message) => {
  for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), content);
  git('-C', dir, 'add', '-A');
  git('-C', dir, '-c', 'user.name=Test', '-c', 'user.email=test@example.invalid',
    'commit', '--quiet', '-m', message);
};

const scenario = () => {
  const root = mkdtempSync(join(tmpdir(), 'sync-mirror-test-'));
  scenarios.push(root);

  const bare = name => {
    const path = join(root, `${name}.git`);
    // The branch under test as the initial branch, so a clone of the still-empty repository is
    // already on it and the seeding below is one commit rather than a checkout dance.
    git('init', '--quiet', '--bare', '--initial-branch', REF, path);
    return path;
  };
  const clone = (source, name) => {
    const path = join(root, name);
    git('clone', '--quiet', source, path);
    return path;
  };

  const source = bare('public');
  const target = bare('private');
  const work = clone(source, 'public-work');

  commit(work, { 'shared.txt': 'public\n', 'engine.txt': 'engine\n' }, 'public base');
  git('-C', work, 'push', '--quiet', 'origin', REF);

  return {
    source,
    target,
    work,
    sync: () => syncBranch({
      source,
      target,
      ref: REF,
      workdir: mkdtempSync(join(root, 'workdir-')),
      stdio: 'ignore',
    }),
    // Everything read back out of a bare repository, which has no working tree to look at.
    filesIn: repo => git('--git-dir', repo, 'ls-tree', '-r', '--name-only', REF).trim().split('\n'),
    fileIn: (repo, name) => git('--git-dir', repo, 'show', `${REF}:${name}`),
    subjectsIn: repo => git('--git-dir', repo, 'log', REF, '--format=%s').trim().split('\n'),
    refsIn: repo => git('--git-dir', repo, 'show-ref').trim(),
  };
};

afterEach(() => {
  for (const root of scenarios.splice(0)) rmSync(root, { recursive: true, force: true });
});

// A branch the mirror has never seen: what the first sync of a competition does.
describe('the first sync of a branch', () => {
  it('creates the branch in the private repository', () => {
    const { target, sync, filesIn, subjectsIn } = scenario();

    sync();

    expect(filesIn(target)).toStrictEqual(['engine.txt', 'shared.txt']);
    expect(subjectsIn(target)).toStrictEqual(['public base']);
  });

  it('makes no merge commit, there being nothing to merge with', () => {
    const { target, sync, subjectsIn } = scenario();

    sync();

    expect(subjectsIn(target)).not.toContain(MERGE_MESSAGE);
  });
});

describe('a sync into a mirror that has its own work', () => {
  // The private repo's branch, carrying a commit the public one does not have — the year's game
  // being developed there while the public repo carries on.
  const withPrivateWork = (files = { 'secret-game.txt': 'unreleased\n' }) => {
    const context = scenario();
    const { source, target, work } = context;
    const privateWork = join(work, '..', 'private-work');

    git('clone', '--quiet', target, privateWork);
    git('-C', privateWork, 'remote', 'add', 'public', source);
    git('-C', privateWork, 'fetch', '--quiet', 'public');
    git('-C', privateWork, 'reset', '--quiet', '--hard', `public/${REF}`);
    commit(privateWork, files, 'private work');
    git('-C', privateWork, 'push', '--quiet', 'origin', REF);

    return context;
  };

  it('keeps what only the private repository has', () => {
    // The one that matters: a sync that dropped the unreleased game would be discovered by
    // whoever is developing it, mid-competition-prep.
    const { target, work, sync, filesIn } = withPrivateWork();

    commit(work, { 'newfile.txt': 'new\n' }, 'public change');
    git('-C', work, 'push', '--quiet', 'origin', REF);
    sync();

    expect(filesIn(target)).toContain('secret-game.txt');
  });

  it('carries the public change over, under a merge commit that says where it came from', () => {
    const { target, work, sync, filesIn, subjectsIn } = withPrivateWork();

    commit(work, { 'newfile.txt': 'new\n' }, 'public change');
    git('-C', work, 'push', '--quiet', 'origin', REF);
    sync();

    expect(filesIn(target)).toContain('newfile.txt');
    expect(subjectsIn(target)[0]).toBe(MERGE_MESSAGE);
  });

  it('resolves a conflicting hunk to the public side, which is the change being carried', () => {
    const { target, work, sync, fileIn } = withPrivateWork({ 'shared.txt': 'private edit\n' });

    commit(work, { 'shared.txt': 'public edit\n' }, 'public change');
    git('-C', work, 'push', '--quiet', 'origin', REF);
    sync();

    expect(fileIn(target, 'shared.txt')).toBe('public edit\n');
  });
});

describe('the direction of a sync', () => {
  // The whole of competition secrecy rests on this one never being wrong. A checkout with both
  // remotes in it is one mistaken `git push` from publishing the year's game; this code path
  // clones the public repo and pushes only to the private one, and here is what says so.
  it('never writes to the public repository', () => {
    const { source, target, work, sync, refsIn } = scenario();
    const privateWork = join(work, '..', 'private-only');

    git('clone', '--quiet', target, privateWork);
    git('-C', privateWork, 'remote', 'add', 'public', source);
    git('-C', privateWork, 'fetch', '--quiet', 'public');
    git('-C', privateWork, 'reset', '--quiet', '--hard', `public/${REF}`);
    commit(privateWork, { 'secret-game.txt': 'unreleased\n' }, 'private work');
    git('-C', privateWork, 'push', '--quiet', 'origin', REF);

    const before = refsIn(source);
    sync();

    expect(refsIn(source)).toBe(before);
  });

  it('refuses a ref that is not a sync branch before touching either repository', () => {
    const { source, target } = scenario();

    expect(() => syncBranch({
      source, target, ref: 'main', workdir: mkdtempSync(join(tmpdir(), 'sync-mirror-test-')), stdio: 'ignore',
    })).toThrow(/not a sync-<name> branch/);
  });
});

describe('the credential', () => {
  const script = readFileSync(fileURLToPath(new URL('./sync-mirror.mjs', import.meta.url)), 'utf8');

  // #462, as scripts/workflow-safety.test.mjs pins it for the workflows. The logic moved out of a
  // workflow and out of the reach of that test, so the rule it enforced moves with it.
  it('is never interpolated into a URL, which git writes into .git/config', () => {
    expect(script).not.toMatch(/https?:\/\/[^\s'"`]*\$[^\s'"`]*@/);
  });

  it('is read from the environment by the askpass helper rather than written into it', () => {
    const dir = mkdtempSync(join(tmpdir(), 'sync-mirror-test-'));
    scenarios.push(dir);

    const helper = readFileSync(writeAskpass(dir), 'utf8');

    expect(helper).toContain('$PRIVATE_PAT');
    expect(helper).not.toMatch(/PRIVATE_PAT=/);
  });
});
