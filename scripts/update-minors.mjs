// The routine half of docs/DEPENDENCIES.md: bump every dependency in every workspace to
// the newest release inside its pinned major, in one edit. A package several workspaces share
// lands on one number by construction, so the tree keeps deduping it to a single install. Majors
// never move here — a major is a decision, taken one at a time (#168) — which is also what keeps
// the "Held back deliberately" list respected without this script knowing it exists.
//
// Only versions older than `.npmrc`'s min-release-age are candidates, since npm would refuse to
// install a younger one (release-age.mjs); a newer release still inside that window is listed as
// waiting, for the next sweep to pick up.
//
// Edits the package.json files and nothing else; the lockfile is npm's to write. The script
// closes by printing the follow-up — `npm install`, the checks, any file outside a
// package.json that a bump also has to touch (ALSO_WRITTEN_IN), and an `npm update` for a bumped
// package the root `overrides` block also names (overriddenPackages).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ALSO_WRITTEN_IN, workspaces } from './dependency-report.mjs';
import { compareStable, minReleaseAge, releases } from './release-age.mjs';
import { isWorkspaceLink } from './resolved-versions.mjs';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));

// An exact stable version, the only thing this repo pins (.npmrc save-exact). Anything else —
// a prerelease, a surviving range — is reported and left alone rather than guessed at.
const STABLE = /^(\d+)\.(\d+)\.(\d+)$/;

// Newest stable release sharing `current`'s major, or undefined when `current` is not an exact
// stable version or no release qualifies — callers report that rather than swallow it.
export const newestWithinMajor = (versions, current) => {
  const major = current.match(STABLE)?.[1];
  if (major === undefined) return undefined;
  return versions.filter(version => version.match(STABLE)?.[1] === major).sort(compareStable).at(-1);
};

// Every package the root `overrides` block forces to a version, at any depth: a string value
// overrides its own key, and a nested object's `.` overrides the package that holds it. A `$name`
// reference follows the root pin by construction, so it is left out.
//
// An override given as a range does not follow a pin bumped here: `npm install` keeps the hoisted
// copy the lockfile already has, since it still satisfies the range, and nests the new pin under its
// workspace. For socket.io that is the split socketio-single-copy.test.mjs fails on (#461).
// `npm update <name>` re-resolves the range and dedupes onto the pin.
export const overriddenPackages = (overrides = {}) => Object.entries(overrides).flatMap(([name, value]) => {
  if (typeof value === 'string') return name === '.' || value.startsWith('$') ? [] : [name];
  const own = typeof value['.'] === 'string' && !value['.'].startsWith('$') ? [name] : [];
  return [...own, ...overriddenPackages(value)];
});

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

  // One registry question per package, all in flight at once (a full packument waits its turn —
  // release-age.mjs); a failed lookup is a report, not a crash — but it does fail the run, because
  // a dependency silently left behind would read as "already current".
  const releaseAge = minReleaseAge();
  const lookups = new Map(await Promise.all([...wanted.keys()].map(async name =>
    [name, await releases(name, releaseAge).catch(error => error)])));

  const bumped = new Map(); // `${name} ${from} -> ${to}` -> [workspaces]
  const changed = new Set();
  const problems = [];
  const waiting = new Set(); // `${name} ${newest}`, a release still inside the release-age window
  for (const [name, uses] of wanted) {
    const lookup = lookups.get(name);
    for (const { workspace, section } of uses) {
      const where = workspace || 'root';
      const pinned = files.get(workspace)[section][name];
      if (lookup instanceof Error) {
        problems.push(`${name} (pinned ${pinned} in ${where}): ${lookup.message}`);
        continue;
      }
      const newestAtAll = newestWithinMajor(lookup.versions, pinned);
      if (newestAtAll === undefined) {
        problems.push(`${name} in ${where}: '${pinned}' is not an exact stable version, left alone`);
        continue;
      }
      const newest = newestWithinMajor(lookup.mature, pinned);
      if (newestAtAll !== pinned && newestAtAll !== newest) waiting.add(`${name} ${newestAtAll}`);
      // Undefined, or below the pin, when the pin itself is younger than the window — taken on
      // purpose (docs/DEPENDENCIES.md § Release-age cooldown), so never walked back.
      if (newest === undefined || compareStable(newest, pinned) <= 0) continue;
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
    const overridden = new Set(overriddenPackages(files.get('').overrides));
    const toDedupe = [...new Set([...bumped.keys()].map(line => line.split(' ')[0]))].filter(name => overridden.has(name));
    console.log('\nNext: npm install,');
    if (toDedupe.length > 0) {
      console.log(`then npm update ${toDedupe.join(' ')} — the root overrides block holds a range for`);
      console.log('each, which npm install leaves on the copy the lockfile already has (npm ls shows the split),');
    }
    console.log('then the usual gates — npm run build, npm run lint, npm run typecheck, npm test.');
    console.log('Majors stay with npm run report:outdated.');
  }

  if (waiting.size > 0) {
    console.log(`\nNewer, but published less than ${releaseAge} days ago (.npmrc min-release-age), so npm will not`);
    console.log(`install them yet — the next sweep picks them up:\n${[...waiting].sort().map(entry => `  ${entry}`).join('\n')}`);
  }

  if (problems.length > 0) {
    console.error(`\nCould not update (${problems.length}):\n${problems.map(problem => `  ${problem}`).join('\n')}`);
    process.exitCode = 1;
  }
}
