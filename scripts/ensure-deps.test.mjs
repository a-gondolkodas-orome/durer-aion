// The guard's whole value is that it skips an install nobody needs, so what
// matters is the two decisions it makes: which inputs are the same as last
// time, and which moved. Both are pure functions over (path, contents) pairs;
// the install itself is one spawnSync call and is not worth mocking.
import { Buffer } from 'node:buffer';
import { describe, expect, it } from 'vitest';

import { changedFiles, hashFiles, install } from './ensure-deps.mjs';

const tree = (lock, workspace) => [
  ['package-lock.json', lock],
  ['packages/game/package.json', workspace],
];

describe('hashFiles', () => {
  it('is the same for the same contents', () => {
    expect(hashFiles(tree('a', 'b'))).toStrictEqual(hashFiles(tree('a', 'b')));
  });

  it('changes when a file does', () => {
    expect(hashFiles(tree('a', 'b'))).not.toStrictEqual(hashFiles(tree('a2', 'b')));
  });

  it('hashes each path independently of the order they arrive in', () => {
    const forwards = hashFiles(tree('a', 'b'));

    expect(hashFiles(tree('a', 'b').reverse())).toStrictEqual(forwards);
  });

  // The stamp is JSON and the inputs are read as buffers; a hash that differed
  // by encoding would reinstall on every run and go unnoticed as merely slow.
  it('reads a buffer and a string alike', () => {
    expect(hashFiles([['x', Buffer.from('a')]])).toStrictEqual(hashFiles([['x', 'a']]));
  });
});

describe('changedFiles', () => {
  const before = hashFiles(tree('a', 'b'));

  it('names nothing when the tree is untouched', () => {
    expect(changedFiles(before, hashFiles(tree('a', 'b')))).toStrictEqual([]);
  });

  it('names the lockfile when it moves', () => {
    expect(changedFiles(before, hashFiles(tree('a2', 'b')))).toStrictEqual(['package-lock.json']);
  });

  it('names a workspace manifest when it moves', () => {
    expect(changedFiles(before, hashFiles(tree('a', 'b2')))).toStrictEqual([
      'packages/game/package.json',
    ]);
  });

  // A workspace added or removed on the branch you switched to is an install,
  // and neither side's map has the path the other does.
  it('names a workspace that appeared, and one that went away', () => {
    const added = hashFiles([...tree('a', 'b'), ['packages/new/package.json', 'c']]);

    expect(changedFiles(before, added)).toStrictEqual(['packages/new/package.json']);
    expect(changedFiles(added, before)).toStrictEqual(['packages/new/package.json']);
  });
});

// #482: a contributor saw "Installing dependencies (no install recorded)" and
// nothing else — the command exited there. npm is `npm.cmd` on Windows, so the
// spawn failed with ENOENT instead of running, and reading only `status` (null
// in that case) turned the failure into a silent exit code.
describe('install', () => {
  const spawnReturning = (result) => {
    const calls = [];
    const spawn = (...args) => (calls.push(args), result);
    return { spawn, calls };
  };

  it('runs npm through a shell on Windows, where npm is a .cmd', () => {
    const { spawn, calls } = spawnReturning({ status: 0 });

    install(spawn, 'win32');

    expect(calls[0][0]).toBe('npm');
    expect(calls[0][1]).toStrictEqual(['ci']);
    expect(calls[0][2].shell).toBe(true);
  });

  it('spawns npm directly everywhere else', () => {
    const { spawn, calls } = spawnReturning({ status: 0 });

    install(spawn, 'linux');

    expect(calls[0][2].shell).toBe(false);
  });

  it('says so when the spawn itself fails, rather than exiting quietly', () => {
    const { spawn } = spawnReturning({ status: null, error: new Error('spawnSync npm ENOENT') });

    const outcome = install(spawn, 'win32');

    expect(outcome.ok).toBe(false);
    expect(outcome.code).toBe(1);
    expect(outcome.message).toMatch(/Could not run npm ci: .*ENOENT/);
  });

  it('passes a failed install\'s own exit code back', () => {
    const { spawn } = spawnReturning({ status: 217 });

    expect(install(spawn, 'linux')).toStrictEqual({ ok: false, code: 217 });
  });

  it('reports a clean install with nothing to say', () => {
    const { spawn } = spawnReturning({ status: 0 });

    expect(install(spawn, 'linux')).toStrictEqual({ ok: true });
  });
});
