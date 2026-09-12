#!/usr/bin/env node
// Runs `npm ci` only when something it installs from has actually moved. Every
// `dev:*` script, `stack:up` and `stack:prod` call this, so switching to a
// branch for a review costs an install only on the branches that changed one —
// which is a minority of them, while `npm ci` deletes and reinstalls the whole
// 900-package tree every time it runs.
//
// The stamp lives inside node_modules on purpose: a tree wiped by hand, by
// `npm ci` itself or by a fresh clone takes the stamp with it, so "no stamp"
// and "no node_modules" are the same state and neither needs a .gitignore
// entry. CI checks out clean and runs no `dev:*` script, so it installs
// unconditionally and is left calling `npm ci` directly. The places that do
// both — the backend image and the two dev containers — follow their `npm ci`
// with `--record`, since a tree this script did not install itself is one it
// cannot tell from an absent one, and would install again.

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { globSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const STAMP = `${repoRoot}node_modules/.durer-deps.json`;
const VERSION = 1;

// The files npm ci reads to decide what lands in node_modules. .nvmrc is here
// because a Node change is a rebuild for anything with a native binding, and
// process.version below catches the developer who switched without it.
const inputPaths = () => [
  'package-lock.json',
  '.npmrc',
  '.nvmrc',
  'package.json',
  // Workspace manifests are what npm ci links; the root `workspaces` field is
  // read rather than listed, since `packages/*` is a glob that grows.
  ...JSON.parse(readFileSync(`${repoRoot}package.json`, 'utf8'))
    .workspaces.flatMap((pattern) => globSync(`${pattern}/package.json`, { cwd: repoRoot }))
    .map((path) => path.replaceAll('\\', '/')),
];

// Content hashes rather than timestamps: `git switch` there and back rewrites the
// file with the bytes it had, and that is precisely the case worth skipping.
export const hashFiles = (entries) =>
  Object.fromEntries(
    entries.map(([path, contents]) => [path, createHash('sha256').update(contents).digest('hex')]),
  );

export const changedFiles = (before, after) =>
  [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter((path) => before[path] !== after[path])
    .sort();

// What the stamp says once the tree matches what is on disk right now.
export const currentStamp = () => ({
  version: VERSION,
  node: process.version,
  files: hashFiles(inputPaths().map((path) => [path, readFileSync(`${repoRoot}${path}`)])),
});

const writeStamp = (stamp, stampPath = STAMP) =>
  writeFileSync(stampPath, `${JSON.stringify(stamp, null, 2)}\n`);

// Records an install this script did not perform, for the callers that install
// unconditionally: the image and the dev containers install from the same
// manifests the check would read, so there is nothing left to decide — but
// `npm ci` on its own leaves no stamp, and the first `dev:*` script then
// installs the whole tree a second time. The path is a parameter so a test can
// read back what this writes without touching the tree it is running from.
export const record = (stampPath = STAMP) => writeStamp(currentStamp(), stampPath);

// npm is `npm.cmd` on Windows, and node cannot exec a .cmd without a shell: the
// spawn fails outright with ENOENT rather than the command exiting non-zero. So
// both have to be checked, and the error said out loud — reading `status` alone
// turned that into a silent exit one line after "Installing dependencies", which
// is what it looked like from the outside (#483).
//
// `spawn` and `platform` are parameters so the two failures can be tested
// without a Windows machine or a real install.
export function install(spawn = spawnSync, platform = process.platform) {
  const { status, error } = spawn('npm', ['ci'], {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: platform === 'win32',
  });

  if (error) {
    return {
      ok: false,
      code: 1,
      message: `Could not run npm ci: ${error.message}\nInstall the dependencies yourself, then run this again.`,
    };
  }

  return status === 0 ? { ok: true } : { ok: false, code: status ?? 1 };
}

export function main() {
  if (process.env.DURER_SKIP_DEPS === '1') return;

  if (process.argv.includes('--record')) {
    record();
    return;
  }

  const current = currentStamp();

  let previous = { version: VERSION, node: null, files: {} };
  try {
    const stamp = JSON.parse(readFileSync(STAMP, 'utf8'));
    // A stamp this script no longer understands is not a reason to trust it.
    if (stamp.version === VERSION) previous = stamp;
  } catch {
    // No stamp, or an unreadable one: install.
  }

  const changed = changedFiles(previous.files, current.files);
  const nodeChanged = previous.node !== current.node;
  if (changed.length === 0 && !nodeChanged) return;

  // A missing stamp means an unknown tree, not fourteen changed files: listing
  // every manifest there would bury the one line that says what to expect.
  const reason = previous.node === null
    ? 'no install recorded'
    : nodeChanged ? `node ${previous.node} -> ${current.node}` : changed.join(', ');

  if (process.argv.includes('--check')) {
    console.log(`node_modules is behind: ${reason}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Installing dependencies (${reason})`);
  const outcome = install();
  if (outcome.message) console.error(outcome.message);
  if (!outcome.ok) {
    process.exitCode = outcome.code;
    return;
  }

  // Written after the install, so an install that died leaves the stamp saying
  // what was last known good rather than claiming this tree.
  writeStamp(current);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
