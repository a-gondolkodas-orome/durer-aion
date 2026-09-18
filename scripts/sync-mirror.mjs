#!/usr/bin/env node
// Mirrors one pushed `sync-*` branch of the public repository into the year's PRIVATE repo — the
// mechanism behind README.md § Competition secrecy. .github/workflows/sync.yml is the trigger;
// this is the whole of what it does.
//
// It lives here rather than as inline shell in that workflow for the reason
// scripts/deploy-dry-run.mjs does: a workflow's secrets are single-valued, so exercising logic
// that exists only inside the workflow means pointing the live PRIVATE_REPO_NAME at a throwaway
// repository and putting it back afterwards. As a script it takes the two repositories as
// arguments, so scripts/sync-mirror.test.mjs can run it between two local bare repos, and a
// maintainer can run it against their own throwaway without touching a secret.
//
// The sync is one-way by construction: `source` is only ever cloned, `target` only ever pushed
// to. Nothing here can publish the private repository's contents, which is the property the whole
// arrangement exists for.

import { execFileSync } from 'node:child_process';
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Cloned by the CLI below. The same constant guards pages-deploy.yml and refuses a dry-run deploy
// in scripts/deploy-dry-run.mjs.
export const PUBLIC_REPO = 'a-gondolkodas-orome/durer-aion';

export const MERGE_MESSAGE = 'Sync from public repository';

// A runner has no git identity, and this is the one command here that writes a commit. Passed per
// command rather than through `git config --global`, which a maintainer running this by hand would
// find had rewritten their own identity. Same bot as scripts/deploy-dry-run.mjs commits as; the
// note there explains the brackets no address parser accepts.
const COMMITTER = ['-c', 'user.name=github-actions[bot]',
  '-c', 'user.email=github-actions[bot]@users.noreply.github.com'];

// The `sync-*` push trigger decides which branches get here, but the rest of the name is whatever
// the pusher called it, and it is spent below on git commands run with the mirror's PAT in scope.
// Pin it to characters that mean nothing to git's option parser or to a path. The commands run
// through execFileSync with no shell, so there is no shell for it to mean anything to either.
const SYNC_BRANCH = /^sync-[A-Za-z0-9._-]+$/;

export const assertSyncBranch = ref => {
  if (!SYNC_BRANCH.test(ref)) throw new Error(`refusing to sync "${ref}": not a sync-<name> branch`);
  return ref;
};

const git = (args, options = {}) => execFileSync('git', args, { stdio: 'inherit', ...options });

const hasRef = (ref, options) => {
  try {
    git(['show-ref', '--quiet', '--verify', ref], { ...options, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

// `source` and `target` are any git URLs — https, ssh, or a local path, which is what lets the
// suite run this between two bare repos in a temp directory.
export const syncBranch = ({ source, target, ref, workdir, env = process.env, stdio = 'inherit' }) => {
  assertSyncBranch(ref);

  const clone = join(workdir, 'source');
  // A credential that never arrives must fail the job rather than block it on a prompt no one
  // will answer.
  const options = { env: { ...env, GIT_TERMINAL_PROMPT: '0' }, stdio };

  git(['clone', '--quiet', source, clone], options);

  const inClone = args => git(args, { ...options, cwd: clone });

  inClone(['checkout', '--quiet', ref]);
  inClone(['remote', 'add', 'private', target]);
  inClone(['remote', 'update']);

  // Absent the first time a branch is synced, which is an ordinary push and not a merge.
  if (hasRef(`refs/remotes/private/${ref}`, { ...options, cwd: clone })) {
    // `-X ours` is the public side — the branch just pushed — because that is the change being
    // carried over. It settles conflicting hunks only: everything the private repo has and the
    // public one does not, the unreleased game above all, is untouched by the merge.
    inClone([...COMMITTER, 'merge', '-X', 'ours', '-m', MERGE_MESSAGE, `private/${ref}`]);
  }

  inClone(['push', 'private', ref]);
};

// The PAT reaches git through this helper rather than through the remote's URL: a URL carrying it
// is written to .git/config, and from there into anything that later reads the checkout — a cache,
// an uploaded artifact, a step added to the job. The helper holds no secret itself, it reads one
// from the environment when git asks, so the token exists only as long as the process does (#462).
export const writeAskpass = dir => {
  const path = join(dir, 'askpass');
  writeFileSync(path, '#!/bin/sh\nprintf "%s\\n" "$PRIVATE_PAT"\n');
  chmodSync(path, 0o700);
  return path;
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { PRIVATE_REPO_NAME, PRIVATE_PAT, REF, RUNNER_TEMP, SYNC_SOURCE, SYNC_TARGET } = process.env;

  // SYNC_SOURCE and SYNC_TARGET are for a hand-run, the way SITE_BASE overrides the derived base
  // path in scripts/deploy-dry-run.mjs: a sync between two repositories of your own — two local
  // paths will do — is how this is rehearsed without the workflow's single-valued secrets.
  // .github/workflows/sync.yml sets neither, so CI takes the defaults by construction.
  //
  // The default source is the constant rather than GITHUB_REPOSITORY, so that the `if:` guard on
  // the workflow is not the only thing keeping the clone off the private side.
  const source = SYNC_SOURCE || `https://github.com/${PUBLIC_REPO}.git`;
  const target = SYNC_TARGET
    || (PRIVATE_REPO_NAME && `https://x-access-token@github.com/${PRIVATE_REPO_NAME}.git`);

  // No mirror configured is the public repository's normal state between competitions, not a
  // failure: the year's repo is created when the year's game starts.
  if (!target) {
    console.log('neither SYNC_TARGET nor PRIVATE_REPO_NAME is set: no mirror to sync to');
    process.exit(0);
  }

  const ref = assertSyncBranch(REF ?? '');
  const workdir = mkdtempSync(join(RUNNER_TEMP || tmpdir(), 'sync-mirror-'));
  const env = { ...process.env };

  // Only when there is one to hand over. A SYNC_TARGET that is a local path or an ssh remote
  // needs none, and git uses whatever credentials that remote already works with. Note that
  // syncBranch sets GIT_TERMINAL_PROMPT=0, so an https target with no token here fails rather
  // than stopping to ask.
  if (PRIVATE_PAT) env.GIT_ASKPASS = writeAskpass(workdir);

  try {
    syncBranch({ source, target, ref, workdir, env });
    // Not the target itself: in CI naming it would put the private repository in a public log.
    console.log(`\n${ref} is mirrored into the target repository`);
  } finally {
    rmSync(workdir, { recursive: true, force: true });
  }
}
