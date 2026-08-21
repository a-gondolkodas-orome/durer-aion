// What `package.json` states is a *range*; what npm installs is in the lockfile. Under
// `save-exact=true` the two strings are identical, which is why both callers here have compared
// declarations so far — and why dropping `save-exact` would have broken them quietly rather than
// loudly: `check-versions.mjs` compares the Playwright string against the devcontainer Dockerfile,
// and `dependency-report.mjs` compares it against the registry's `latest`. A caret makes the first
// a permanent mismatch and the second a permanent "behind".
//
// Stripping the `^` would have made both compile again and both wrong: the floor of a range is not
// the version anyone runs. The lockfile is, under either convention.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const appDir = fileURLToPath(new URL('..', import.meta.url));
const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));

// This app had its own lockfile before joining the npm workspaces and shares the root's after, so
// look for both rather than pinning the layout to one moment in the migration.
const lockfilePath = [`${appDir}package-lock.json`, `${repoRoot}package-lock.json`].find(existsSync);

// Pure half, so the lookup rules are testable without a lockfile on disk.
//
// npm hoists what it can to the root of the tree and nests the rest, so a workspace's dependency
// legitimately lives in either place — and which one is not stable across installs. Check the
// nested path first: when a package is in both, the nested copy is the one this app resolves.
export const findResolved = (lockfile, name) =>
  lockfile?.packages?.[`apps/strategy-practice/node_modules/${name}`]?.version ??
  lockfile?.packages?.[`node_modules/${name}`]?.version;

let cached;
const lockfile = () => {
  // Parsed once: the root lockfile is megabytes, and the report asks about every dependency.
  if (cached === undefined) {
    cached = lockfilePath ? JSON.parse(readFileSync(lockfilePath, 'utf8')) : null;
  }
  return cached;
};

// The installed version of `name`, or undefined when the lockfile cannot answer — callers decide
// whether that is a failure (check-versions) or a reason to fall back (dependency-report).
export const resolvedVersion = name => findResolved(lockfile(), name);
