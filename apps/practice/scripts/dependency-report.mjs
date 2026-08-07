// Every version this project depends on is pinned exactly (`save-exact=true`, plus the lockfile),
// so nothing ever drifts on its own and nothing ever goes stale loudly either — a dependency four
// minors behind looks exactly like one released yesterday. This reports what is behind.
//
// It is the outward-facing half of scripts/check-versions.mjs: that one compares the versions
// written down in this repo against *each other* and fails a build on a mismatch; this one compares
// them against *upstream* and never fails anything. Deciding to upgrade stays a human act — see the
// "Dependency updates" section of README.md.
//
// Three sources, each read-only over the network:
//   - npm packages: dependencies + devDependencies, against the registry's `latest` dist-tag.
//   - GitHub Actions: every `uses:` in .github/workflows, against the action's latest release.
//   - Node: .nvmrc, against the newest release sharing its major.
//
// Deliberately not `npm outdated`: under save-exact the manifest version *is* the installed
// version, so the registry can be asked directly and this needs no install and no node_modules.
// Deliberately not `npm audit` either — advisories are Dependabot alerts' job, and they arrive with
// an urgency a monthly digest would only dilute.
import { appendFileSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = file => readFileSync(`${root}${file}`, 'utf8');

const NODE = 'Node (.nvmrc)';

// Bumping either of these means editing files beyond the one this report names, so say so in the
// row itself. README.md lists which files; `npm run check:versions` fails until they agree.
const MULTI_FILE_PINS = {
  playwright: '.devcontainer/Dockerfile too',
  [NODE]: '5 files — see README'
};

const fetchJson = async url => {
  // The GitHub API rate-limits anonymous callers to 60 requests an hour, which four actions fit
  // inside comfortably; CI passes a token anyway so a busy runner IP cannot exhaust it.
  const headers = { accept: 'application/json' };
  if (process.env.GITHUB_TOKEN && url.startsWith('https://api.github.com/')) {
    headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};

// A row is { name, current, latest } once resolved, or { name, error } when the lookup failed.
// A failed lookup is reported, never thrown: one unreachable registry must not cost the whole
// report, and a row that silently vanished would read as "up to date".
const checkVersion = async (name, current, lookup) => {
  try {
    return { name, current, latest: await lookup() };
  } catch (error) {
    return { name, current, error: error.message };
  }
};

const npmRows = () => {
  const packageJson = JSON.parse(read('package.json'));
  const packages = { ...packageJson.dependencies, ...packageJson.devDependencies };
  return Object.entries(packages).map(([name, current]) =>
    checkVersion(name, current, async () => (await fetchJson(`https://registry.npmjs.org/${name}/latest`)).version)
  );
};

const actionRows = () => {
  const workflows = readdirSync(`${root}.github/workflows`).filter(file => /\.ya?ml$/.test(file));
  // Actions are pinned to a major tag (`@v7`), so only the major is ever comparable — a patch
  // release inside v7 is picked up without any edit here.
  const used = new Set(
    workflows.flatMap(file => [...read(`.github/workflows/${file}`).matchAll(/uses:\s*(\S+?)@(v\d+)/g)].map(
      ([, action, tag]) => `${action}@${tag}`
    ))
  );
  return [...used].sort().map(entry => {
    const [action, tag] = entry.split('@');
    return checkVersion(action, tag, async () => {
      const { tag_name: latest } = await fetchJson(`https://api.github.com/repos/${action}/releases/latest`);
      // Releases are tagged `v7.0.2`; the pin only names `v7`, so compare like with like.
      return `v${latest.replace(/^v/, '').split('.')[0]}`;
    });
  });
};

const nodeRow = () => {
  const current = read('.nvmrc').trim();
  return checkVersion(NODE, current, async () => {
    const releases = await fetchJson('https://nodejs.org/dist/index.json');
    const major = current.split('.')[0];
    // The feed is newest-first, and staying on the pinned major is the point — a major bump is a
    // decision, not something a monthly report should nudge.
    const newest = releases.find(release => release.version.replace(/^v/, '').split('.')[0] === major);
    if (!newest) throw new Error(`no release found for Node ${major}.x`);
    return newest.version.replace(/^v/, '');
  });
};

const isMajorBump = ({ current, latest }) =>
  current.replace(/^v/, '').split('.')[0] !== latest.replace(/^v/, '').split('.')[0];

// Pure: rows in, markdown out. The only branchy part of this script, and the only part worth a spec.
export const formatReport = rows => {
  const failed = rows.filter(row => row.error);
  const behind = rows.filter(row => !row.error && row.current !== row.latest);
  const major = behind.filter(isMajorBump);
  const minor = behind.filter(row => !isMajorBump(row));

  if (behind.length === 0 && failed.length === 0) {
    return `Every pinned version is current — ${rows.length} checked, nothing behind.`;
  }

  const table = (title, entries, note) =>
    entries.length === 0
      ? []
      : [
        `### ${title}`,
        '',
        note,
        '',
        '| | pinned | latest |',
        '| --- | --- | --- |',
        ...entries.map(({ name, current, latest }) => {
          const multiFile = MULTI_FILE_PINS[name];
          return `| \`${name}\`${multiFile ? ` <br> ⚠️ ${multiFile}` : ''} | ${current} | ${latest} |`;
        }),
        ''
      ];

  return [
    `${behind.length} of ${rows.length} pinned versions are behind.`,
    '',
    ...table(
      `Patch and minor (${minor.length})`,
      minor,
      'Safe to batch into one PR. `npm run test` and the build are the gate.'
    ),
    ...table(
      `Major (${major.length})`,
      major,
      'One at a time, against the upstream upgrade guide — see [#168](https://github.com/a-gondolkodas-orome/durer-jatekok/issues/168) for the shape.'
    ),
    ...(failed.length === 0
      ? []
      : [
        `### Could not check (${failed.length})`,
        '',
        ...failed.map(({ name, current, error }) => `- \`${name}\` (pinned ${current}): ${error}`),
        ''
      ]),
    '<sub>Generated by `npm run report:outdated`. Majors stay manual; this only remembers.</sub>'
  ].join('\n');
};

// Guarded so the spec can import formatReport without the script reaching for the network.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const rows = await Promise.all([...npmRows(), ...actionRows(), nodeRow()]);
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
