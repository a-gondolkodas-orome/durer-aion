// Reports how much of the *logic* a pull request adds is reached by a spec, and fails the build
// when too little of it is. What it measures and why, including the 85% floor and the twenty-line
// exemption, is in AGENTS.md § Coverage. Three implementation choices worth knowing here:
//
//   - It reads `npm run coverage:unswept`, so what is left is coverage a real spec caused.
//   - It measures added *lines*, not files. Every non-spec .ts file in src/ is already at non-zero
//     coverage, because the overview specs import gameList, which transitively loads every game;
//     the floor is ~10% of top-level import and const lines, not 0%. So "this file is uncovered"
//     never fires, while "these added lines never ran" does.
//   - "Added" means added against the base branch *and* against the upstream one. A branch that
//     merges main back in adds all of main's lines against its base, and none of them are its to
//     cover; see `intersectAddedLines`.
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { posix } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
// Diffs run here: the measured set spans two workspaces (below), so a diff taken
// from apps/practice would drop the engine's half before anything measured it.
const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));

// Below this, the percentage says more about arithmetic than about testing: at twelve lines two
// uncovered ones are already 83%, which is how #450 — a two-line fix to a memo key — would have been
// blocked. Twenty is where a single line stops moving the number by more than the bar's own width.
// The thing this is actually for, a new game or bot, is hundreds of lines and never near the floor.
const MIN_MEASURED_LINES = 20;
// Recent history runs 87-96% over any range wide enough to measure, so this is a floor under the
// habit rather than a stretch above it: what fails here is untested logic, not an imperfect diff.
const THRESHOLD = 85;

// The engine and games packages are measured alongside this app's src: they are this app's
// engine and games moved out, and their specs run in this suite — leaving them out would mean
// the one gated number stopped gating exactly the code this app runs on.
const MEASURED_ROOTS = ['apps/practice/src/', 'packages/engine/src/', 'packages/games/src/'];

// The .tsx half is the JSX half, and is swept by renders.spec.tsx rather than unit-tested; the
// exclusions mirror `coverage.exclude` in vite.config.js, which are absent from the report anyway.
// Paths are repo-relative — both the diff and the normalized lcov speak that form.
export const isMeasured = path =>
  MEASURED_ROOTS.some(measuredRoot => path.startsWith(measuredRoot)) &&
  path.endsWith('.ts') &&
  !path.endsWith('.spec.ts') &&
  path !== 'apps/practice/src/test-utils.ts' &&
  path !== 'apps/practice/src/test-setup.ts';

// lcov SF records are relative to the coverage run's root, this app: `src/…` for its own files,
// `../../packages/engine/src/…` for the engine's. The diff speaks repo-relative; meet it there.
export const repoRelativeLcovPath = path => posix.normalize(posix.join('apps/practice', path));

// `git diff --unified=0` output in, { path -> Set of added line numbers } out. A hunk header reads
// `@@ -12,0 +13,4 @@`, where the count after the comma defaults to 1 when omitted.
export const parseAddedLines = diff => {
  const added = new Map();
  let path = null;
  for (const line of diff.split('\n')) {
    if (line.startsWith('+++ ')) {
      // `+++ /dev/null` is a deleted file: nothing was added to it, and it has no coverage to read.
      const target = line.slice(4).trim();
      path = target === '/dev/null' ? null : target.replace(/^b\//, '');
      continue;
    }
    if (!path || !line.startsWith('@@')) continue;
    const [, start, count] = line.match(/^@@ -\S+ \+(\d+)(?:,(\d+))? @@/) ?? [];
    if (start === undefined) continue;
    const lines = added.get(path) ?? new Set();
    for (let i = 0; i < Number(count ?? 1); i++) lines.add(Number(start) + i);
    added.set(path, lines);
  }
  return added;
};

// Keeps only the lines a branch added against *both* commits it is compared with — its base and
// the upstream branch it may have merged in. One base is not enough to express "this branch's
// work": a PR stacked on an older branch, or one that merged main to resolve a conflict, adds
// every line main gained since the fork when measured against its base alone, and that is how a
// contributor ends up asked to cover somebody else's game. Both diffs are taken against the same
// HEAD, so a line number means the same file position in each and the intersection is exact.
//
// When the branch merged nothing, the two comparisons are the same commit and this is the identity
// — which is what keeps every ordinary PR's verdict unchanged.
export const intersectAddedLines = (added, alsoAdded) =>
  new Map(
    [...added]
      .map(([path, lines]) => {
        const other = alsoAdded.get(path);
        return [path, other ? new Set([...lines].filter(line => other.has(line))) : new Set()];
      })
      .filter(([, lines]) => lines.size > 0)
  );

// lcov.info in, { path -> { line -> hit count } } out. Only executable lines get a DA record, so
// blank lines, comments and type-only declarations drop out of the measurement by themselves.
export const parseLcov = lcov => {
  const hits = new Map();
  let lines = null;
  for (const line of lcov.split('\n')) {
    if (line.startsWith('SF:')) {
      lines = new Map();
      hits.set(line.slice(3).trim(), lines);
    } else if (lines && line.startsWith('DA:')) {
      const [number, count] = line.slice(3).split(',');
      lines.set(Number(number), Number(count));
    } else if (line.startsWith('end_of_record')) {
      lines = null;
    }
  }
  return hits;
};

// A file is { path, measured, uncovered, unloaded }, where `measured` counts the added lines that
// are executable at all and `uncovered` lists those of them that never ran.
//
// `unloaded` is the case that took a probe to find: a module no spec imports gets an lcov record
// with no DA lines whatsoever — v8 only ever sees the files something loaded, and `coverage.include`
// adds the rest as empty records rather than as fully-uncovered ones. Left to the percentage those
// files would count as zero added lines and pass as "nothing to measure", which is the wrong answer
// for a module nothing in the repo touches. It is not a failure either, because a type-only module
// (`export type Board = number[]`) is indistinguishable from lcov's side — types are erased, so it
// has no executable line to report whether it was loaded or not. So: named in the report, counted
// in neither column, and left to the reviewer.
export const collect = (added, hits) =>
  [...added]
    .filter(([path]) => isMeasured(path))
    .flatMap(([path, lines]) => {
      const fileHits = hits.get(path);
      // Absent from the report altogether despite `coverage.include` naming every file under src/ —
      // a file deleted by a later commit in the same PR. Nothing to say about it.
      if (!fileHits) return [];
      if (fileHits.size === 0) return [{ path, measured: 0, uncovered: [], unloaded: true }];
      const executable = [...lines].filter(line => fileHits.has(line)).sort((a, b) => a - b);
      if (executable.length === 0) return [];
      return [{
        path,
        measured: executable.length,
        uncovered: executable.filter(line => fileHits.get(line) === 0),
        unloaded: false
      }];
    })
    .sort((a, b) => b.uncovered.length - a.uncovered.length);

const listLines = uncovered => {
  const shown = uncovered.slice(0, 8).join(', ');
  return uncovered.length > 8 ? `${shown} … +${uncovered.length - 8} more` : shown;
};

// Pure: files in, { passed, markdown } out. Everything branchy lives here, and so does the spec.
export const formatReport = files => {
  const measured = files.reduce((sum, file) => sum + file.measured, 0);
  const uncovered = files.reduce((sum, file) => sum + file.uncovered.length, 0);
  const unloaded = files.filter(file => file.unloaded);

  const unloadedNote =
    unloaded.length === 0
      ? []
      : [
        '',
        `No executable line was measured in ${unloaded.map(file => `\`${file.path}\``).join(', ')} — ` +
          'either the module is type-only, or nothing in the repo imports it, in which case no spec ' +
          'can be reaching it. Not counted above either way.'
      ];

  if (measured === 0) {
    return {
      passed: true,
      markdown: ['No non-JSX source lines added — nothing to measure.', ...unloadedNote].join('\n')
    };
  }

  const percent = Math.round(((measured - uncovered) * 100) / measured);
  // Small diffs are reported but never fail: see MIN_MEASURED_LINES.
  const passed = percent >= THRESHOLD || measured < MIN_MEASURED_LINES;
  const headline = `**${percent}%** of the ${measured} non-JSX lines this PR adds are reached by a spec.`;

  if (uncovered === 0) {
    return { passed, markdown: [`${headline} Nothing to flag.`, ...unloadedNote].join('\n') };
  }

  return {
    passed,
    markdown: [
      headline,
      '',
      '| file | added | not reached |',
      '| --- | --- | --- |',
      ...files
        .filter(file => file.uncovered.length > 0)
        .map(file => `| \`${file.path}\` | ${file.measured} | ${listLines(file.uncovered)} |`),
      '',
      passed
        ? `<sub>Passing: the bar is ${THRESHOLD}%, and a diff under ${MIN_MEASURED_LINES} measured ` +
          'lines never fails.</sub>'
        : `Below the ${THRESHOLD}% bar. These lines are not *unit-tested* — a registered game is ` +
          'still played by the plays-to-an-end sweep, which catches an illegal move or a game that ' +
          'never ends, but nothing here asserts that the strategy is right. Add a spec next to the ' +
          'module (`gameplay.spec.ts`, `bot-strategy.spec.ts`), or label the PR `skip coverage` if ' +
          'this diff genuinely has nothing worth asserting.',
      ...unloadedNote,
      '',
      '<sub>Measured against `npm run coverage:unswept`, so the plays-to-an-end and renders sweeps ' +
        'do not count as coverage. Run `npm run coverage:patch` locally.</sub>'
    ].join('\n')
  };
};

// `maxBuffer` because the default is 1 MB and a diff is not a status line: a branch stacked on an
// older base, or one adding a pre-generated moves table, goes past it and execFileSync kills git
// with SIGTERM. What surfaces is `spawnSync git ENOBUFS` — which reads as git having failed, and
// sends whoever is looking at it hunting a git problem that does not exist.
const git = (...args) =>
  execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 });

// For the questions where "git cannot answer that" is itself an answer — a remote-tracking ref the
// checkout does not have, two histories with no common ancestor — rather than something to abort on.
const askGit = (...args) => {
  try {
    return git(...args).trim();
  } catch {
    return null;
  }
};

const flag = (name, fallback) =>
  (process.argv.includes(name) && process.argv[process.argv.indexOf(name) + 1]) || fallback;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const base = flag('--base', 'origin/main');
  // The branch this one is ultimately headed for, which is not always the branch it is opened
  // against — a PR stacked on another PR has that PR's branch as its base. Passed by the workflow
  // from the base repository's default branch.
  const upstream = flag('--upstream', 'origin/main');

  let baseMergeBase;
  try {
    // Against the merge base rather than the tip of the base branch: commits landed on main since
    // this branch forked are not its to cover. Needs the full history (`fetch-depth: 0` in CI) —
    // under the default shallow fetch there is no common ancestor to find.
    baseMergeBase = git('merge-base', base, 'HEAD').trim();
  } catch {
    // git's own error is on stderr above; naming one cause here would have sent the first CI
    // failure of this job hunting a shallow fetch when the problem was file ownership.
    console.error(`Could not find the merge base of ${base} and HEAD — see git's error above.`);
    process.exit(1);
  }
  // No second commit, so the working tree is what gets compared: run this before committing and it
  // still measures what you just wrote. In CI the tree is clean and this is `<base>...HEAD`.
  //
  // From the repository root, so the diff carries both measured workspaces; `isMeasured` is what
  // scopes it. The trap is the same one `--relative` used to guard when this ran from
  // apps/practice: the diff's paths and the normalized lcov paths must agree exactly, or every
  // path fails the join and the job passes every PR with "nothing to measure".
  const addedLines = mergeBase => parseAddedLines(git('diff', '--unified=0', mergeBase));

  let added = addedLines(baseMergeBase);
  // Skipped rather than fatal when the upstream branch is not in the checkout: the report is then
  // the one this job produced before any of this existed, and a coverage gate is not the place to
  // fail a PR over a missing remote-tracking ref. Said out loud so a surprising verdict has its
  // cause on the same page.
  const upstreamRef = askGit('rev-parse', '--verify', '--quiet', `${upstream}^{commit}`);
  const upstreamMergeBase = upstreamRef && askGit('merge-base', upstreamRef, 'HEAD');
  if (!upstreamRef) {
    console.log(`\`${upstream}\` is not in this checkout, so lines already on it are counted too.\n`);
  } else if (upstreamMergeBase && upstreamMergeBase !== baseMergeBase) {
    // The branch forked from upstream somewhere other than where it forked from its base — it
    // merged upstream in, or it is stacked on a branch that predates commits it now carries.
    added = intersectAddedLines(added, addedLines(upstreamMergeBase));
  }

  const lcovPath = `${root}reports/coverage/lcov.info`;
  if (!existsSync(lcovPath)) {
    console.error(`No coverage at ${lcovPath}. Run \`npm run coverage:patch\`, which measures it first.`);
    process.exit(1);
  }
  const lcov = readFileSync(lcovPath, 'utf8');
  const hits = new Map([...parseLcov(lcov)].map(([path, lines]) => [repoRelativeLcovPath(path), lines]));

  const { passed, markdown } = formatReport(collect(added, hits));

  console.log(markdown);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`);
  if (!passed) process.exit(1);
}
