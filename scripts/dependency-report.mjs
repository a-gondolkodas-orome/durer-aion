// A lockfile pins every dependency exactly, so a package four minors behind looks exactly like one
// released yesterday until something asks. This reports what is behind (README § Dependency
// updates), across every workspace at once.
//
// It is the outward-facing half of apps/strategy-practice/scripts/check-versions.mjs: that one
// compares the versions written down in this repo against *each other* and fails a build on a
// mismatch; this one compares them against *upstream* and never fails anything.
//
// Four sources, each read-only over the network:
//   - npm packages: every workspace's dependencies + devDependencies, against the registry's
//     `latest` dist-tag. The workspaces themselves are not among them — see npmRows.
//   - GitHub Actions: every `uses:` in .github/workflows, against the action's latest release.
//   - Node: each .nvmrc, against the newest release sharing its major.
//   - Docker images: the tag each deployed image is pinned to, against Docker Hub — see DOCKER_IMAGES.
//
// Deliberately not `npm outdated`: the lockfile already names the installed version, so the
// registry can be asked directly and this needs no install and no node_modules.
// Deliberately not `npm audit` either — advisories are Dependabot alerts' job, and they arrive with
// an urgency a monthly digest would only dilute.
import { appendFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { isWorkspaceLink, resolvedVersion } from './resolved-versions.mjs';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const read = file => readFileSync(`${repoRoot}${file}`, 'utf8');

const WORKFLOWS = '.github/workflows/';

// Places a version is written down that no package.json names, so a bump has to touch them in the
// same commit. `npm run check:versions` fails until they agree; this only says where to look.
export const ALSO_WRITTEN_IN = {
  playwright: ['apps/strategy-practice/.devcontainer/Dockerfile']
};

// Majors this repo has decided not to take yet, and the one line that says why. Listing them
// among the real work made every month's issue read as five upgrades when only one was: they are
// reported, because a hold worth keeping is worth re-reading, but in their own section.
// README § Held back deliberately owns the reasoning and is where a hold is argued or lifted; the
// value here is only the caption a table cell has room for. The spec fails when the two lists stop
// naming the same packages, so a hold cannot be lifted in one of them alone.
export const HELD_BACK = {
  koa: 'boardgame.io constructs the Koa app, at koa@^2',
  '@koa/router': 'the backend types boardgame.io\'s own @koa/router@10 instance',
  typescript: 'typescript-eslint caps typescript at <6.1.0',
  '@types/node': 'policy: tracks the Node major in .nvmrc'
};

// Node is written down far more often than it is depended on, and listing all of it in a table cell
// would crowd out the version. The app's README carries the list; the row carries the count.
const NVMRC_COMPANIONS = {
  'apps/strategy-practice/.nvmrc': ['4 more files — see apps/strategy-practice/README.md']
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
const checkVersion = async (name, current, where, lookup) => {
  try {
    return { name, current, where, latest: await lookup() };
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
        (await fetchJson(`https://registry.npmjs.org/${name}/latest`)).version)
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
      const releases = await fetchJson('https://nodejs.org/dist/index.json');
      const major = current.split('.')[0];
      // The feed is newest-first, and staying on the pinned major is the point — a major bump is a
      // decision, not something a monthly report should nudge.
      const newest = releases.find(release => release.version.replace(/^v/, '').split('.')[0] === major);
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

// Pure: rows in, markdown out. The only branchy part of this script, and the only part worth a spec.
export const formatReport = rows => {
  const failed = rows.filter(row => row.error);
  const behind = rows.filter(row => !row.error && row.current !== row.latest);
  // A hold is about the major: a patch released inside the version we are held at is still routine,
  // so only the major bumps are partitioned, and the rest of the split is untouched.
  const held = behind.filter(row => isMajorBump(row) && row.name in HELD_BACK);
  const major = behind.filter(row => isMajorBump(row) && !(row.name in HELD_BACK));
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
          `| \`${row.name}\` | ${row.current} | ${row.latest} | ${row.where.join(', ')} |`
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
      '`npm run update:minors` makes every one of these edits that lives in a `package.json`, then `npm install`; an `.nvmrc` or docker tag row is a hand edit. Safe to batch into one PR — `npm test` and the build are the gate, plus `npm test --workspace=strategy-practice` for anything that app pins itself.'
    ),
    ...table(
      `Major (${major.length})`,
      major,
      'One at a time, against the upstream upgrade guide — see [#168](https://github.com/a-gondolkodas-orome/durer-jatekok/issues/168) for the shape.'
    ),
    // Absolute, not relative: this report's home is an issue body, where `README.md#…` resolves
    // against the issue rather than the repository.
    ...table(
      `Held back deliberately (${held.length})`,
      held,
      'Not work: each stays until its named blocker moves — see [README § Held back deliberately](https://github.com/a-gondolkodas-orome/durer-aion#held-back-deliberately).',
      ['held back by', ({ name }) => HELD_BACK[name]]
    ),
    ...(failed.length === 0
      ? []
      : [
        `### Could not check (${failed.length})`,
        '',
        ...failed.map(({ name, current, where, error }) => `- \`${name}\` (pinned ${current} in ${where.join(', ')}): ${error}`),
        ''
      ]),
    '<sub>Generated by `npm run report:outdated`. Majors stay manual; this only remembers.</sub>'
  ].join('\n');
};

// Guarded so the spec can import formatReport without the script reaching for the network.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const rows = await Promise.all([...npmRows(), ...actionRows(), ...nodeRows(), ...dockerRows()]);
  const report = formatReport(rows);

  const outFile = process.argv[process.argv.indexOf('--out') + 1];
  if (process.argv.includes('--out') && outFile) writeFileSync(outFile, report);
  console.log(report);

  // The workflow decides whether to open, edit or close its issue from this, rather than by
  // grepping the report's prose. A failed lookup deliberately counts as "behind": the one thing
  // the report must never do is stay quiet about a version it could not check.
  const behind = rows.some(({ error, current, latest }) => error || current !== latest);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `behind=${behind}\n`);
}
