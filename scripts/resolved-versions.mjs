// What `package.json` states is a *range*; what npm installs is in the lockfile. Both callers here
// compare against something exact — `check-versions.test.mjs` compares the Playwright string against the
// devcontainer Dockerfile, `dependency-report.mjs` compares it against the registry's `latest` — so
// a range is the wrong end of the comparison twice over: a caret makes the first a permanent
// mismatch and the second a permanent "behind".
//
// Stripping the `^` would have made both compile again and both wrong: the floor of a range is not
// the version anyone runs. The lockfile is.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// One lockfile, at the repo root, for every workspace — npm writes no others, and installing from
// inside a workspace directory is a documented mistake rather than a supported layout (CLAUDE.md).
const lockfilePath = fileURLToPath(new URL('../package-lock.json', import.meta.url));

// Pure half, so the lookup rules are testable without a lockfile on disk.
//
// npm hoists what it can to the root of the tree and nests the rest, so a workspace's dependency
// legitimately lives in either place — and which one is not stable across installs. Check the
// nested path first: when a package is in both, the nested copy is the one that workspace resolves.
// `workspace` is a repo-relative directory, or '' for the root package itself.
const entries = (lockfile, name, workspace = '') =>
  (workspace ? [`${workspace}/node_modules/${name}`, `node_modules/${name}`] : [`node_modules/${name}`])
    .map(path => lockfile?.packages?.[path]);

export const findResolved = (lockfile, name, workspace) =>
  entries(lockfile, name, workspace).map(entry => entry?.version).find(Boolean);

// A dependency on one of this repo's own workspaces — `"engine": "*"` — is not installed from the
// registry at all: npm links the directory, and the lockfile entry says `link: true` and carries no
// version. Names like `engine`, `game` and `games` also belong to unrelated packages on the public
// registry, so a caller that cannot tell the difference ends up asking about a stranger's package.
export const findWorkspaceLink = (lockfile, name, workspace) =>
  entries(lockfile, name, workspace).some(entry => entry?.link === true);

let cached;
const lockfile = () => {
  // Parsed once: the lockfile is megabytes, and the report asks about every dependency of every
  // workspace.
  if (cached === undefined) {
    cached = JSON.parse(readFileSync(lockfilePath, 'utf8'));
  }
  return cached;
};

// The version `workspace` resolves for `name`, or undefined when the lockfile cannot answer —
// callers decide whether that is a failure (check-versions) or a reason to fall back
// (dependency-report).
export const resolvedVersion = (name, workspace) => findResolved(lockfile(), name, workspace);

// Whether `name` is one of this repo's workspaces rather than a published package.
export const isWorkspaceLink = (name, workspace) => findWorkspaceLink(lockfile(), name, workspace);
