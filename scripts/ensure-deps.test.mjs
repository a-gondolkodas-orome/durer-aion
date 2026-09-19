// The guard's whole value is that it skips an install nobody needs, so what
// matters is the two decisions it makes: which inputs are the same as last
// time, and which moved. Both are pure functions over (path, contents) pairs;
// the install itself is one spawnSync call and is not worth mocking.
import { Buffer } from 'node:buffer';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

import { changedFiles, currentStamp, hashFiles, install, record } from './ensure-deps.mjs';

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

// #483: a contributor saw "Installing dependencies (no install recorded)" and
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

// `npm ci` run by something else — the backend image, either dev container —
// leaves node_modules full and the stamp absent, which reads here as a tree
// that was never installed. `--record` is how those say what they did, so what
// it writes has to be a stamp this script would then accept.
describe('record', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'ensure-deps-'));

  afterAll(() => rmSync(tmp, { recursive: true, force: true }));

  it('writes a stamp that leaves nothing for the check to install', () => {
    const stamp = join(tmp, 'stamp.json');

    record(stamp);
    const written = JSON.parse(readFileSync(stamp, 'utf8'));

    expect(changedFiles(written.files, currentStamp().files)).toStrictEqual([]);
    expect(written.node).toBe(process.version);
  });

  // The version is what tells a stamp from a later format apart, and a missing
  // one would be read as a stamp to discard — an install on every run, silently.
  it('stamps the format it was written in', () => {
    const stamp = join(tmp, 'version.json');

    record(stamp);

    expect(JSON.parse(readFileSync(stamp, 'utf8')).version).toBe(currentStamp().version);
  });

  it('records the manifests the check reads, the lockfile among them', () => {
    const stamp = join(tmp, 'files.json');

    record(stamp);

    const { files } = JSON.parse(readFileSync(stamp, 'utf8'));
    expect(Object.keys(files)).toContain('package-lock.json');
    expect(Object.keys(files)).toContain('packages/game/package.json');
  });
});
