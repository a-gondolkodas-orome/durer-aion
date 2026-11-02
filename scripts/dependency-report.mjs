// A lockfile pins every dependency exactly, so a package four minors behind looks exactly like one
// released yesterday until something asks. This reports what is behind (docs/DEPENDENCIES.md),
// across every workspace at once, and with `--write` makes the routine half of it: `npm run
// update:minors` bumps every pin to the newest release inside its major.
//
// It is the outward-facing half of check-versions.test.mjs: that one compares the versions
// written down in this repo against *each other* and fails the test run on a mismatch; this one compares them against *upstream* and never fails anything.
//
// Four sources, each read-only over the network:
//   - npm packages: every workspace's dependencies + devDependencies, against the registry's
//     `latest` dist-tag — or the newest version below it that `.npmrc`'s min-release-age lets npm
//     install, see release-age.mjs. The workspaces themselves are not among them — see npmPins.
//   - GitHub Actions: every `uses:` in .github/workflows, against the action's latest release.
//   - Node: the .nvmrc, against the newest release sharing its major.
//   - Docker images: the tag each deployed image is pinned to, against Docker Hub — see DOCKER_IMAGES.
//
// Deliberately not `npm outdated`: the lockfile already names the installed version, so the
// registry can be asked directly, and the script needs nothing from node_modules.
// Deliberately not `npm audit` either — advisories are Dependabot alerts' job, and they arrive with
// an urgency a monthly digest would only dilute.
import { appendFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { compareStable, minReleaseAge, newestMature, newestWithinMajor, releases } from './release-age.mjs';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const read = file => readFileSync(`${repoRoot}${file}`, 'utf8');
const manifestPath = workspace => (workspace ? `${workspace}/package.json` : 'package.json');

const WORKFLOWS = '.github/workflows/';

// Places a version is written down that no package.json names, so a bump has to touch them in the
// same commit. check-versions.test.mjs fails until they agree; this only says where to look.
const ALSO_WRITTEN_IN = {
  playwright: ['apps/strategy-practice/.devcontainer/Dockerfile']
};

// Majors this repo has decided not to take yet, and the one line that says why. Listing them
// among the real work made every month's issue read as five upgrades when only one was: they are
// reported, because a hold worth keeping is worth re-reading, but in their own section.
// DEPENDENCIES.md § Held back deliberately owns the reasoning and is where a hold is argued or
// lifted; `reason` here is only the caption a table cell has room for. The spec fails when the two
// lists stop naming the same packages, so a hold cannot be lifted in one of them alone.
// `blocker` is the package whose own manifest keeps the hold, and the `field` of it that names the
// held package: the row shows the range the blocker's newest installable release declares, for
// the maintainer to read against the version held back from. A hold without one is a policy.
export const HELD_BACK = {
  koa: {
    reason: 'boardgame.io constructs the Koa app, at koa@^2',
    blocker: { name: 'boardgame.io', field: 'dependencies' }
  },
  '@koa/router': {
    reason: 'the backend types boardgame.io\'s own @koa/router@10 instance',
    blocker: { name: 'boardgame.io', field: 'dependencies' }
  },
  typescript: {
    reason: 'typescript-eslint caps typescript at <6.1.0',
    blocker: { name: 'typescript-eslint', field: 'peerDependencies' }
  },
  '@types/node': { reason: 'policy: tracks the Node major in .nvmrc' }
};

// The images a deployment actually runs. Pinning them exactly (#203) made two deploys weeks apart
// the same deploy; it also means nothing moves them when a base image ships a security patch, which
// is what these rows are for.
// `line` is how many version components a row may not cross, and the reasoning is the same one
// nodeRow gives: a major is a decision, not a monthly nudge — the compose file argues postgres's.
// nginx is the exception at 2, because its majors and minors both carry meaning: 1.30.x is the
// stable line and 1.31.x is mainline, both current on Docker Hub, so a major-wide row would keep
// offering mainline as if it were a patch.
// Not here on purpose: mcr.microsoft.com/devcontainers/*, which floats on a major because a dev
// environment is not a deployment.
export const DOCKER_IMAGES = [
  { image: 'node', where: 'Dockerfile', line: 1 },
  { image: 'nginx', where: 'apps/online-frontend/nginx/Dockerfile', line: 2 },
  { image: 'postgres', where: 'docker-compose.yml', line: 1 }
];

const fetchJson = async url => {
  // The GitHub API rate-limits anonymous callers to 60 requests an hour, which the handful of
  // actions this repo uses fits inside comfortably; CI passes a token anyway so a busy runner IP
  // cannot exhaust it.
  const headers = { accept: 'application/json' };
  if (process.env.GITHUB_TOKEN && url.startsWith('https://api.github.com/')) {
    headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};

// The version `workspace` installs, from the lockfile — '' is the root package. npm hoists what it
// can and nests the rest, and which one is not stable across installs; when a package is in both
// places, the nested copy is the one that workspace resolves, so it is looked at first.
export const findResolved = (lockfile, name, workspace = '') =>
  (workspace && lockfile.packages[`${workspace}/node_modules/${name}`]?.version)
  || lockfile.packages[`node_modules/${name}`]?.version;

let lockfile;
export const resolvedVersion = (name, workspace) =>
  findResolved(lockfile ??= JSON.parse(read('package-lock.json')), name, workspace);

// The workspaces npm installs, plus '' for the root package, which carries the shared build and
// test tooling. Read from the `workspaces` field rather than globbed off disk: a directory left
// behind by a rename keeps its node_modules and has no package.json to read.
const workspaces = () => {
  const { workspaces: patterns } = JSON.parse(read('package.json'));
  return ['', ...patterns.flatMap(pattern => {
    if (!pattern.endsWith('/*')) return [pattern];
    const parent = pattern.slice(0, -2);
    return readdirSync(`${repoRoot}${parent}`)
      .map(entry => `${parent}/${entry}`)
      .filter(dir => existsSync(`${repoRoot}${dir}/package.json`));
  })];
};

// Every registry dependency of every workspace: `{ name, current, uses }`, where `current` is the
// installed version and `uses` the `{ workspace, section, pinned }` entries that name it.
// Keyed by package *and* installed version, not by name: a workspace is free to pin a version
// the others have not taken yet, and one row per name would report one of the two versions as
// if it were both. Two upgrades, two rows — and `where` says which is which.
const npmPins = manifests => {
  // A sibling workspace has no upstream to be behind: it is this repo, and the registry answers
  // about whatever public package happens to share its name (`game`, `schemas`).
  const ownNames = new Set(manifests.values().map(manifest => manifest.name));
  const pins = new Map();
  for (const [workspace, manifest] of manifests) {
    for (const section of ['dependencies', 'devDependencies']) {
      for (const [name, pinned] of Object.entries(manifest[section] ?? {})) {
        if (ownNames.has(name)) continue;
        // The installed version, not the declared range: comparing `^1.2.0` against the registry's
        // `1.5.0` would report every dependency as behind forever.
        const current = resolvedVersion(name, workspace) ?? pinned;
        const key = `${name}@${current}`;
        if (!pins.has(key)) pins.set(key, { name, current, uses: [] });
        pins.get(key).uses.push({ workspace, section, pinned });
      }
    }
  }
  return [...pins.values()].sort((a, b) => a.name.localeCompare(b.name) || a.current.localeCompare(b.current));
};

const readManifests = () => new Map(workspaces().map(workspace => [workspace, JSON.parse(read(manifestPath(workspace)))]));

// One registry question per package, however many rows or pins name it.
const lookups = new Map();
const releasesOf = name => {
  if (!lookups.has(name)) lookups.set(name, releases(name));
  return lookups.get(name);
};

// A row is { name, current, where, latest } once resolved, or { name, current, where, error } when
// the lookup failed. A failed lookup is reported, never thrown: one unreachable registry must not
// cost the whole report, and a row that silently vanished would read as "up to date".
// A lookup answers the latest version, or `{ latest, cooling }` when a newer one is still inside
// the release-age window and so not yet installable.
const checkVersion = async (name, current, where, lookup) => {
  try {
    const found = await lookup();
    return { name, current, where, ...(typeof found === 'string' ? { latest: found } : found) };
  } catch (error) {
    return { name, current, where, error: error.message };
  }
};

const npmRows = manifests => npmPins(manifests).map(({ name, current, uses }) => {
  const where = [...new Set(uses.map(({ workspace }) => workspace || 'root')), ...(ALSO_WRITTEN_IN[name] ?? [])];
  return checkVersion(name, current, where, async () => newestMature({ current, ...(await releasesOf(name)) }));
});

const actionRows = () => {
  const workflows = readdirSync(`${repoRoot}${WORKFLOWS}`).filter(file => /\.ya?ml$/.test(file));
  // Actions are pinned to a major tag (`@v7`), so only the major is ever comparable — a patch
  // release inside v7 is picked up without any edit here. Keyed by pin rather than by action: two
  // workflows on different majors are two separate bumps.
  const used = new Map();
  for (const file of workflows.sort()) {
    for (const [, action, tag] of read(`${WORKFLOWS}${file}`).matchAll(/uses:\s*(\S+?)@(v\d+)/g)) {
      const key = `${action}@${tag}`;
      if (!used.has(key)) used.set(key, { action, tag, where: [] });
      if (!used.get(key).where.includes(file)) used.get(key).where.push(file);
    }
  }

  return [...used.values()].sort((a, b) => a.action.localeCompare(b.action) || a.tag.localeCompare(b.tag))
    .map(({ action, tag, where }) => checkVersion(action, tag, where, async () => {
      const { tag_name: latest } = await fetchJson(`https://api.github.com/repos/${action}/releases/latest`);
      // Releases are tagged `v7.0.2`; the pin only names `v7`, so compare like with like.
      return `v${latest.replace(/^v/, '').split('.')[0]}`;
    }));
};

// Node is written down far more often than it is depended on, and listing all of it in a table cell
// would crowd out the version. check-versions.test.mjs carries the list; the row carries the count.
const nodeRow = () => {
  const current = read('.nvmrc').trim();
  return checkVersion('Node', current, ['.nvmrc', '6 more files — see check-versions.test.mjs'], async () => {
    const feed = await fetchJson('https://nodejs.org/dist/index.json');
    const major = current.split('.')[0];
    // The feed is newest-first, and staying on the pinned major is the point — a major bump is a
    // decision, not something a monthly report should nudge.
    const newest = feed.find(release => release.version.replace(/^v/, '').split('.')[0] === major);
    if (!newest) throw new Error(`no release found for Node ${major}.x`);
    // An .nvmrc names either a whole major (`24`) or an exact version (`24.11.1`), and a file
    // that pins only the major is current for the whole of it. Compare at the precision it was
    // written with, or it would be reported behind every month with nothing to change.
    return newest.version.replace(/^v/, '').split('.').slice(0, current.split('.').length).join('.');
  });
};

// Docker Hub answers with every variant of every tag — `1.30.4-alpine3.24`, `1.30-perl`, `1.30` —
// newest-pushed-first rather than newest-version-first. Picking the pin's successor out of that is
// parsing, not network, which is why it is a function of its own and the one part of the lookup
// with a spec: it has to keep 1.30.4 ahead of the mainline 1.31.4, of the abbreviated 1.30 and of
// every suffixed variant.
export const newestTagInLine = (tags, current, line) => {
  const parts = current.split('.');
  const prefix = parts.slice(0, line);
  const candidates = tags
    // Bare tags only: a variant pins a base distribution this repo never asked for.
    .filter(tag => /^\d+(\.\d+)*$/.test(tag))
    .map(tag => tag.split('.'))
    // Same precision as the pin, so `1.30` does not win over `1.30.4` by being a prefix of it, and
    // same line, so a major (or minor) bump stays a decision rather than a monthly nudge.
    .filter(tag => tag.length === parts.length && prefix.every((part, i) => tag[i] === part));
  if (candidates.length === 0) throw new Error(`no ${prefix.join('.')}.x tag found`);
  // Numeric, not lexicographic: 1.30.10 is newer than 1.30.9.
  return candidates
    .sort((a, b) => a.reduce((diff, part, i) => diff || Number(part) - Number(b[i]), 0))
    .at(-1)
    .join('.');
};

const dockerRows = () => DOCKER_IMAGES.map(({ image, where, line }) => {
  // `FROM node:24.20.0` in a Dockerfile, `image: postgres:17.11` in the compose file.
  const [, current] = read(where).match(new RegExp(`(?:FROM|image:)[ \\t]*${image}:(\\S+)`)) ?? [];
  return checkVersion(`library/${image}`, current ?? 'unknown', [where], async () => {
    if (!current) throw new Error(`no ${image}: tag found in ${where}`);
    // Filtered server-side to the pinned line, because these repositories carry thousands of tags
    // and one page is all this asks for. `library/` is where Docker Hub keeps the official images;
    // the endpoint answers anonymously, and GITHUB_TOKEN does not apply to it.
    const { results } = await fetchJson(
      `https://hub.docker.com/v2/repositories/library/${image}/tags?page_size=100&name=${current.split('.').slice(0, line).join('.')}.`);
    return newestTagInLine(results.map(({ name }) => name), current, line);
  });
});

const isMajorBump = ({ current, latest }) =>
  current.replace(/^v/, '').split('.')[0] !== latest.replace(/^v/, '').split('.')[0];

// A hold is about the major: a patch released inside the version we are held at is still routine,
// so only a major bump of a held package is a held row.
const isHeld = row => !row.error && row.current !== row.latest && isMajorBump(row) && row.name in HELD_BACK;

// What the blocker's newest installable release declares for the held package: `{ blocker, range }`,
// with `range` undefined once it declares none at all, or `{ error }`. Attached to the row as `hold`.
const checkHold = async ({ name }) => {
  const { blocker } = HELD_BACK[name];
  try {
    // '0.0.0' as `current`: newestMature only uses it as a floor, and there is no pin of the blocker
    // to keep it at — what matters is what npm would install today.
    const { latest } = newestMature({ current: '0.0.0', ...(await releasesOf(blocker.name)) });
    const manifest = await fetchJson(`https://registry.npmjs.org/${blocker.name}/${latest}`);
    return { blocker: `${blocker.name}@${latest}`, range: manifest[blocker.field]?.[name] };
  } catch (error) {
    return { error: error.message };
  }
};

// A range may contain `||`, which would split a markdown table cell.
const cellSafe = text => text.replaceAll('|', '\\|');

// The range is shown, not judged: whether `^2.13.3` still excludes 3.2.1 takes a glance, and the
// maintainer is the one who re-reads the hold anyway.
const holdCell = row => {
  const { reason } = HELD_BACK[row.name];
  const { hold } = row;
  if (!hold) return reason;
  if (hold.error) return `${reason} (could not check: ${cellSafe(hold.error)})`;
  if (hold.range === undefined) {
    return `${reason} (**${hold.blocker} no longer declares ${row.name}** — re-read the hold)`;
  }
  return `${reason} (${hold.blocker} declares \`${cellSafe(hold.range)}\`)`;
};

// Pure: rows in, markdown out. The only branchy part of this script, and the only part worth a spec.
// `releaseAge` is .npmrc's min-release-age, named in the report only when some row is cooling.
export const formatReport = (rows, releaseAge = 0) => {
  const failed = rows.filter(row => row.error);
  const behind = rows.filter(row => !row.error && row.current !== row.latest);
  const held = behind.filter(isHeld);
  const major = behind.filter(row => isMajorBump(row) && !isHeld(row));
  const minor = behind.filter(row => !isMajorBump(row));

  if (behind.length === 0 && failed.length === 0) {
    return `Every pinned version is current — ${rows.length} checked, nothing behind.`;
  }

  // `extra` adds one more column, which only the held-back table has: [heading, row => cell].
  const table = (title, entries, note, extra) =>
    entries.length === 0
      ? []
      : [
        `### ${title}`,
        '',
        note,
        '',
        `| | pinned | latest | written down in |${extra ? ` ${extra[0]} |` : ''}`,
        `| --- | --- | --- | --- |${extra ? ' --- |' : ''}`,
        ...entries.map(row =>
          `| \`${row.name}\` | ${row.current} | ${row.latest}${row.cooling ? ` (${row.cooling} too new)` : ''} | ${row.where.join(', ')} |`
          + (extra ? ` ${extra[1](row)} |` : '')),
        ''
      ];

  return [
    `${behind.length} of ${rows.length} pinned versions are behind`
    + (held.length === 0 ? '.' : `, ${held.length} of them held back deliberately.`),
    '',
    ...table(
      `Patch and minor (${minor.length})`,
      minor,
      '`npm run update:minors` makes every one of these edits that lives in a `package.json`, then `npm install`; an `.nvmrc` or docker tag row is a hand edit. Safe to batch into one PR — `npm test` and the build are the gate.'
    ),
    ...table(
      `Major (${major.length})`,
      major,
      'One at a time, against the upstream upgrade guide — see [#253](https://github.com/a-gondolkodas-orome/durer-aion/pull/253) for the shape.'
    ),
    // Absolute, not relative: this report's home is an issue body, where `DEPENDENCIES.md#…` resolves
    // against the issue rather than the repository.
    ...table(
      `Held back deliberately (${held.length})`,
      held,
      'Not work: each stays until its named blocker moves — see [DEPENDENCIES.md § Held back deliberately](https://github.com/a-gondolkodas-orome/durer-aion/blob/main/docs/DEPENDENCIES.md#held-back-deliberately).',
      ['held back by', holdCell]
    ),
    ...(behind.some(row => row.cooling)
      ? [`A version marked *too new* was published less than ${releaseAge} days ago: \`.npmrc\` sets \`min-release-age\`, so npm will not install it yet — see [DEPENDENCIES.md § Release-age cooldown](https://github.com/a-gondolkodas-orome/durer-aion/blob/main/docs/DEPENDENCIES.md#release-age-cooldown). Its row offers the newest version that is old enough.`, '']
      : []),
    ...(failed.length === 0
      ? []
      : [
        `### Could not check (${failed.length})`,
        '',
        ...failed.map(({ name, current, where, error }) => `- \`${name}\` (pinned ${current} in ${where.join(', ')}): ${error}`),
        ''
      ]),
    // No package.json names latex.js, so none of the sources above sees it, and it releases too
    // rarely to be worth one of its own.
    'latex.js is loaded from jsdelivr and pinned in each frontend\'s `index.html`, outside this table: compare that pin with [npm](https://www.npmjs.com/package/latex.js) by hand.',
    '',
    '<sub>Generated by `npm run report:outdated`. Majors stay manual; this only remembers.</sub>'
  ].join('\n');
};

const report = async () => {
  const rows = await Promise.all([...npmRows(readManifests()), ...actionRows(), nodeRow(), ...dockerRows()]);
  await Promise.all(rows.filter(row => isHeld(row) && HELD_BACK[row.name].blocker)
    .map(async row => { row.hold = await checkHold(row); }));
  const text = formatReport(rows, minReleaseAge());

  const outFile = process.argv[process.argv.indexOf('--out') + 1];
  if (process.argv.includes('--out') && outFile) writeFileSync(outFile, text);
  console.log(text);

  // The workflow decides whether to open, edit or close its issue from this, rather than by
  // grepping the report's prose. A failed lookup deliberately counts as "behind": the one thing
  // the report must never do is stay quiet about a version it could not check.
  const behind = rows.some(({ error, current, latest }) => error || current !== latest);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `behind=${behind}\n`);
};

// `--write`, the routine half of docs/DEPENDENCIES.md: every pin to the newest installable release
// inside its major, in every workspace at once. A package several workspaces share lands on one
// number by construction, so the tree keeps deduping it to a single install. Majors never move here
// — a major is a decision, taken one at a time (#168) — which is also what keeps the held-back
// list respected without consulting it. Edits the package.json files and nothing else; the
// lockfile is npm's to write.
const writeMinors = async () => {
  const manifests = readManifests();
  const pins = npmPins(manifests);
  const names = [...new Set(pins.map(({ name }) => name))];
  const releaseAge = minReleaseAge();
  // A failed lookup is a report, not a crash — but it does fail the run, because a dependency
  // silently left behind would read as "already current".
  const found = new Map(await Promise.all(names.map(async name => [name, await releasesOf(name).catch(error => error)])));

  const bumped = new Map(); // `${name} ${from} -> ${to}` line -> [workspaces]
  const changed = new Set();
  const problems = [];
  const waiting = new Set(); // `${name} ${newest}`, a release still inside the release-age window
  for (const { name, uses } of pins) {
    const lookup = found.get(name);
    for (const { workspace, section, pinned } of uses) {
      const where = workspace || 'root';
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
      manifests.get(workspace)[section][name] = newest;
      changed.add(workspace);
      const line = `${name.padEnd(35)} ${pinned.padEnd(10)} -> ${newest}`;
      if (!bumped.has(line)) bumped.set(line, []);
      bumped.get(line).push(where);
    }
  }

  for (const workspace of changed) {
    writeFileSync(`${repoRoot}${manifestPath(workspace)}`, JSON.stringify(manifests.get(workspace), null, 2) + '\n');
  }

  if (bumped.size === 0) {
    console.log(`Every pinned version is current within its major — ${names.length} packages checked.`);
  } else {
    console.log(`Bumped, within each pinned major (${bumped.size} of ${names.length} packages):\n`);
    for (const [line, where] of [...bumped].sort()) console.log(`  ${line}   (${where.join(', ')})`);
    const elsewhere = [...bumped.keys()]
      .map(line => line.split(' ')[0]).filter(name => ALSO_WRITTEN_IN[name])
      .map(name => `  ${name} is also written down in: ${ALSO_WRITTEN_IN[name].join(', ')}`);
    if (elsewhere.length > 0) console.log(`\nThe same bump has to reach files no package.json names:\n${elsewhere.join('\n')}`);
    console.log('\nNext: npm install,');
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
};

// Guarded so the spec can import formatReport without the script reaching for the network.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await (process.argv.includes('--write') ? writeMinors() : report());
}
