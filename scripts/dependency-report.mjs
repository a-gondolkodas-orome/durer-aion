// A lockfile pins every dependency exactly, so a package four minors behind looks exactly like one
// released yesterday until something asks. This reports what is behind (docs/DEPENDENCIES.md),
// across every workspace at once.
//
// It is the outward-facing half of check-versions.test.mjs: that one compares the versions
// written down in this repo against *each other* and fails the test run on a mismatch; this one compares them against *upstream* and never fails anything.
//
// Four sources, each read-only over the network:
//   - npm packages: every workspace's dependencies + devDependencies, against the registry's
//     `latest` dist-tag — or the newest version below it that `.npmrc`'s min-release-age lets npm
//     install, see release-age.mjs. The workspaces themselves are not among them — see npmRows.
//   - GitHub Actions: every `uses:` in .github/workflows, against the action's latest release.
//   - Node: each .nvmrc, against the newest release sharing its major.
//   - Docker images: the tag each deployed image is pinned to, against Docker Hub — see DOCKER_IMAGES.
//
// Deliberately not `npm outdated`: the lockfile already names the installed version, so the
// registry can be asked directly. The one thing it takes from node_modules is semver, to read the
// range a hold's blocker declares — see HELD_BACK.
// Deliberately not `npm audit` either — advisories are Dependabot alerts' job, and they arrive with
// an urgency a monthly digest would only dilute.
import { appendFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import semver from 'semver';
import { minReleaseAge, newestMature, releases } from './release-age.mjs';
import { isWorkspaceLink, resolvedVersion } from './resolved-versions.mjs';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const read = file => readFileSync(`${repoRoot}${file}`, 'utf8');

const WORKFLOWS = '.github/workflows/';

// Places a version is written down that no package.json names, so a bump has to touch them in the
// same commit. check-versions.test.mjs fails until they agree; this only says where to look.
export const ALSO_WRITTEN_IN = {
  playwright: ['apps/strategy-practice/.devcontainer/Dockerfile']
};

// Majors this repo has decided not to take yet, and the one line that says why. Listing them
// among the real work made every month's issue read as five upgrades when only one was: they are
// reported, because a hold worth keeping is worth re-reading, but in their own section.
// DEPENDENCIES.md § Held back deliberately owns the reasoning and is where a hold is argued or
// lifted; `reason` here is only the caption a table cell has room for. The spec fails when the two
// lists stop naming the same packages, so a hold cannot be lifted in one of them alone.
// `blocker` is the package whose own manifest keeps the hold, and the `field` of it that names the
// held package: each month the report reads that range off the blocker's newest installable release,
// and says so in the row once it admits the version we are held back from. A hold without one is a
// policy, which no manifest can lift.
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

// Node is written down far more often than it is depended on, and listing all of it in a table cell
// would crowd out the version. check-versions.test.mjs carries the list; the row carries the count.
const NVMRC_COMPANIONS = {
  '.nvmrc': ['6 more files — see check-versions.test.mjs']
};

// The images a deployment actually runs. Pinning them exactly (#203) made two deploys weeks apart
// the same deploy; it also means nothing moves them when a base image ships a security patch, which
// is what these rows are for.
// `line` is how many version components a row may not cross, and the reasoning is the same one
// nodeRows gives: a major is a decision, not a monthly nudge — the compose file argues postgres's.
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

// The workspaces npm installs, plus '' for the root package, which carries the shared build and
// test tooling. Read from the `workspaces` field rather than globbed off disk: a directory left
// behind by a rename keeps its node_modules and has no package.json to read.
export const workspaces = () => {
  const { workspaces: patterns } = JSON.parse(read('package.json'));
  return ['', ...patterns.flatMap(pattern => {
    if (!pattern.endsWith('/*')) return [pattern];
    const parent = pattern.slice(0, -2);
    return readdirSync(`${repoRoot}${parent}`)
      .map(entry => `${parent}/${entry}`)
      .filter(dir => existsSync(`${repoRoot}${dir}/package.json`));
  })];
};

const npmRows = () => {
  // Keyed by package *and* installed version, not by name: a workspace is free to pin a version
  // the others have not taken yet, and one row per name would report one of the two versions as
  // if it were both. Two upgrades, two rows — and `where` says which is which.
  const rows = new Map();

  for (const workspace of workspaces()) {
    const packageJson = JSON.parse(read(workspace ? `${workspace}/package.json` : 'package.json'));
    for (const [name, declared] of Object.entries({ ...packageJson.dependencies, ...packageJson.devDependencies })) {
      // A sibling workspace has no upstream to be behind: it is this repo, and the registry answers
      // about whatever public package happens to share its name. See resolved-versions.mjs.
      if (isWorkspaceLink(name, workspace)) continue;
      // The installed version, not the declared range: comparing `^1.2.0` against the registry's
      // `1.5.0` would report every dependency as behind forever. See resolved-versions.mjs.
      const current = resolvedVersion(name, workspace) ?? declared;
      const key = `${name}@${current}`;
      if (!rows.has(key)) rows.set(key, { name, current, where: [] });
      rows.get(key).where.push(workspace || 'root');
    }
  }

  return [...rows.values()]
    .sort((a, b) => a.name.localeCompare(b.name) || a.current.localeCompare(b.current))
    .map(({ name, current, where }) =>
      checkVersion(name, current, [...where, ...(ALSO_WRITTEN_IN[name] ?? [])], async () =>
        newestMature({ current, ...(await releases(name)) }))
    );
};

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

const nodeRows = () => {
  const files = ['.nvmrc', ...workspaces().filter(Boolean).map(workspace => `${workspace}/.nvmrc`)]
    .filter(file => existsSync(`${repoRoot}${file}`));

  return files.map(file => {
    const current = read(file).trim();
    return checkVersion('Node', current, [file, ...(NVMRC_COMPANIONS[file] ?? [])], async () => {
      const feed = await fetchJson('https://nodejs.org/dist/index.json');
      const major = current.split('.')[0];
      // The feed is newest-first, and staying on the pinned major is the point — a major bump is a
      // decision, not something a monthly report should nudge.
      const newest = feed.find(release => release.version.replace(/^v/, '').split('.')[0] === major);
      if (!newest) throw new Error(`no release found for Node ${major}.x`);
      // An .nvmrc names either a whole major (`24`) or an exact version (`24.11.1`), and a file
      // that pins only the major is current for the whole of it. Compare at the precision it was
      // written with, or the root would be reported behind every month with nothing to change.
      return newest.version.replace(/^v/, '').split('.').slice(0, current.split('.').length).join('.');
    });
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
    const { latest } = newestMature({ current: '0.0.0', ...(await releases(blocker.name)) });
    const manifest = await fetchJson(`https://registry.npmjs.org/${blocker.name}/${latest}`);
    return { blocker: `${blocker.name}@${latest}`, range: manifest[blocker.field]?.[name] };
  } catch (error) {
    return { error: error.message };
  }
};

// Whether a held row's blocker still blocks: false only when the range it declares admits the
// version the row is held back from, or it no longer declares one. A row the check could not settle —
// a policy, a failed lookup, a range semver cannot read (an `npm:` alias) — counts as still held,
// which is what the row said before there was a check; its cell says which it was.
const stillHeld = ({ latest, hold }) =>
  !hold || Boolean(hold.error)
  || (hold.range !== undefined && (!semver.validRange(hold.range) || !semver.satisfies(latest, hold.range)));

// A range may contain `||`, which would split a markdown table cell.
const cellSafe = text => text.replaceAll('|', '\\|');

const holdCell = row => {
  const { reason } = HELD_BACK[row.name];
  const { hold } = row;
  if (!hold) return reason;
  if (hold.error) return `${reason} (could not check: ${cellSafe(hold.error)})`;
  if (hold.range === undefined) {
    return `**blocker gone?** ${hold.blocker} no longer declares ${row.name} — re-read the hold`;
  }
  const declared = `${hold.blocker} declares \`${cellSafe(hold.range)}\``;
  if (!semver.validRange(hold.range)) return `${reason} (could not read: ${declared})`;
  return stillHeld(row)
    ? `${reason} (${declared})`
    : `**blocker gone?** ${declared}, which admits ${row.latest} — re-read the hold`;
};

// Pure: rows in, markdown out. The only branchy part of this script, and the only part worth a spec.
// `releaseAge` is .npmrc's min-release-age, named in the report only when some row is cooling.
export const formatReport = (rows, releaseAge = 0) => {
  const failed = rows.filter(row => row.error);
  const behind = rows.filter(row => !row.error && row.current !== row.latest);
  const held = behind.filter(isHeld);
  const lifted = held.filter(row => !stillHeld(row));
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
    + (held.length === 0 ? '.' : `, ${held.length} of them held back deliberately`
      // Said up here because the held-back section reads as "not work", and a lifted hold is.
      + (lifted.length === 0 ? '.' : ` — ${lifted.length} of whose blockers looks gone.`)),
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

// Guarded so the spec can import formatReport without the script reaching for the network.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const rows = await Promise.all([...npmRows(), ...actionRows(), ...nodeRows(), ...dockerRows()]);
  await Promise.all(rows.filter(row => isHeld(row) && HELD_BACK[row.name].blocker)
    .map(async row => { row.hold = await checkHold(row); }));
  const report = formatReport(rows, minReleaseAge());

  const outFile = process.argv[process.argv.indexOf('--out') + 1];
  if (process.argv.includes('--out') && outFile) writeFileSync(outFile, report);
  console.log(report);

  // The workflow decides whether to open, edit or close its issue from this, rather than by
  // grepping the report's prose. A failed lookup deliberately counts as "behind": the one thing
  // the report must never do is stay quiet about a version it could not check.
  const behind = rows.some(({ error, current, latest }) => error || current !== latest);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `behind=${behind}\n`);
}
