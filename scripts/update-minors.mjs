// The routine half of README § Dependency updates: bump every dependency in every workspace to
// the newest release inside its pinned major, in one edit. A package several workspaces share
// lands on one number by construction, so the tree keeps deduping it to a single install. Majors
// never move here — a major is a decision, taken one at a time (#168) — which is also what keeps
// the "Held back deliberately" list respected without this script knowing it exists.
//
// Edits the package.json files and nothing else; the lockfile is npm's to write. The script
// closes by printing the follow-up — `npm install`, the checks, and any file outside a
// package.json that a bump also has to touch (ALSO_WRITTEN_IN).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ALSO_WRITTEN_IN, workspaces } from './dependency-report.mjs';
import { isWorkspaceLink } from './resolved-versions.mjs';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));

// An exact stable version, the only thing this repo pins (.npmrc save-exact). Anything else —
// a prerelease, a surviving range — is reported and left alone rather than guessed at.
const STABLE = /^(\d+)\.(\d+)\.(\d+)$/;

const byParts = (a, b) => {
  const [aParts, bParts] = [a, b].map(version => version.split('.').map(Number));
  return aParts[0] - bParts[0] || aParts[1] - bParts[1] || aParts[2] - bParts[2];
};

// Newest stable release sharing `current`'s major, or undefined when `current` is not an exact
// stable version or no release qualifies — callers report that rather than swallow it.
export const newestWithinMajor = (versions, current) => {
  const major = current.match(STABLE)?.[1];
  if (major === undefined) return undefined;
  return versions.filter(version => version.match(STABLE)?.[1] === major).sort(byParts).at(-1);
};

// The abbreviated packument: the full one carries every version's whole manifest and runs to
// megabytes for old packages; this variant is just the version list and dist-tags.
const versionsOf = async name => {
  const response = await fetch(`https://registry.npmjs.org/${name}`, {
    headers: { accept: 'application/vnd.npm.install-v1+json' }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return Object.keys((await response.json()).versions);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const files = new Map(); // workspace dir -> parsed package.json
  const wanted = new Map(); // package name -> [{ workspace, section }]
  for (const workspace of workspaces()) {
    const packageJson = JSON.parse(readFileSync(`${repoRoot}${workspace ? `${workspace}/` : ''}package.json`, 'utf8'));
    files.set(workspace, packageJson);
    for (const section of ['dependencies', 'devDependencies']) {
      for (const name of Object.keys(packageJson[section] ?? {})) {
        if (isWorkspaceLink(name, workspace)) continue;
        if (!wanted.has(name)) wanted.set(name, []);
        wanted.get(name).push({ workspace, section });
      }
    }
  }

  // One registry question per package, all in flight at once; a failed lookup is a report, not a
  // crash — but it does fail the run, because a dependency silently left behind would read as
  // "already current".
  const lookups = new Map(await Promise.all([...wanted.keys()].map(async name =>
    [name, await versionsOf(name).catch(error => error)])));

  const bumped = new Map(); // `${name} ${from} -> ${to}` -> [workspaces]
  const changed = new Set();
  const problems = [];
  for (const [name, uses] of wanted) {
    const versions = lookups.get(name);
    for (const { workspace, section } of uses) {
      const where = workspace || 'root';
      const pinned = files.get(workspace)[section][name];
      if (versions instanceof Error) {
        problems.push(`${name} (pinned ${pinned} in ${where}): ${versions.message}`);
        continue;
      }
      const newest = newestWithinMajor(versions, pinned);
      if (newest === undefined) {
        problems.push(`${name} in ${where}: '${pinned}' is not an exact stable version, left alone`);
        continue;
      }
      if (newest === pinned) continue;
      files.get(workspace)[section][name] = newest;
      changed.add(workspace);
      const line = `${name.padEnd(35)} ${pinned.padEnd(10)} -> ${newest}`;
      if (!bumped.has(line)) bumped.set(line, []);
      bumped.get(line).push(where);
    }
  }

  for (const workspace of changed) {
    writeFileSync(`${repoRoot}${workspace ? `${workspace}/` : ''}package.json`, JSON.stringify(files.get(workspace), null, 2) + '\n');
  }

  if (bumped.size === 0) {
    console.log(`Every pinned version is current within its major — ${wanted.size} packages checked.`);
  } else {
    console.log(`Bumped, within each pinned major (${bumped.size} of ${wanted.size} packages):\n`);
    for (const [line, where] of [...bumped].sort()) console.log(`  ${line}   (${where.join(', ')})`);
    const elsewhere = [...bumped.keys()]
      .map(line => line.split(' ')[0]).filter(name => ALSO_WRITTEN_IN[name])
      .map(name => `  ${name} is also written down in: ${ALSO_WRITTEN_IN[name].join(', ')}`);
    if (elsewhere.length > 0) console.log(`\nThe same bump has to reach files no package.json names:\n${elsewhere.join('\n')}`);
    console.log('\nNext: npm install, then the usual gates — npm run build, npm run lint, npm run typecheck,');
    console.log('npm test. Majors stay with npm run report:outdated.');
  }

  if (problems.length > 0) {
    console.error(`\nCould not update (${problems.length}):\n${problems.map(problem => `  ${problem}`).join('\n')}`);
    process.exitCode = 1;
  }
}
