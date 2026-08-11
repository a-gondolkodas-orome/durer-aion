// Reports how much of the *logic* a pull request adds is reached by a spec, and fails the build
// when too little of it is. What it measures and why, including the 85% floor and the twenty-line
// exemption, is in AGENTS.md § Coverage. Two implementation choices worth knowing here:
//
//   - It reads `npm run coverage:unswept`, so what is left is coverage a real spec caused.
//   - It measures added *lines*, not files. Every non-spec .ts file in src/ is already at non-zero
//     coverage, because the overview specs import gameList, which transitively loads every game;
//     the floor is ~10% of top-level import and const lines, not 0%. So "this file is uncovered"
//     never fires, while "these added lines never ran" does.
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

// Below this, the percentage says more about arithmetic than about testing: at twelve lines two
// uncovered ones are already 83%, which is how #450 — a two-line fix to a memo key — would have been
// blocked. Twenty is where a single line stops moving the number by more than the bar's own width.
// The thing this is actually for, a new game or bot, is hundreds of lines and never near the floor.
const MIN_MEASURED_LINES = 20;
// Recent history runs 87-96% over any range wide enough to measure, so this is a floor under the
// habit rather than a stretch above it: what fails here is untested logic, not an imperfect diff.
const THRESHOLD = 85;

// The .tsx half is the JSX half, and is swept by renders.spec.tsx rather than unit-tested; the
// exclusions mirror `coverage.exclude` in vite.config.js, which are absent from the report anyway.
export const isMeasured = path =>
  path.startsWith('src/') &&
  path.endsWith('.ts') &&
  !path.endsWith('.spec.ts') &&
  path !== 'src/test-utils.ts' &&
  path !== 'src/test-setup.ts';

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

const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' });

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const base = (process.argv.includes('--base') && process.argv[process.argv.indexOf('--base') + 1]) || 'origin/main';

  let mergeBase;
  try {
    // Against the merge base rather than the tip of the base branch: commits landed on main since
    // this branch forked are not its to cover. Needs the full history (`fetch-depth: 0` in CI) —
    // under the default shallow fetch there is no common ancestor to find.
    mergeBase = git('merge-base', base, 'HEAD').trim();
  } catch {
    // git's own error is on stderr above; naming one cause here would have sent the first CI
    // failure of this job hunting a shallow fetch when the problem was file ownership.
    console.error(`Could not find the merge base of ${base} and HEAD — see git's error above.`);
    process.exit(1);
  }
  // No second commit, so the working tree is what gets compared: run this before committing and it
  // still measures what you just wrote. In CI the tree is clean and this is `<base>...HEAD`.
  const diff = git('diff', '--unified=0', mergeBase);

  const lcovPath = `${root}reports/coverage/lcov.info`;
  if (!existsSync(lcovPath)) {
    console.error(`No coverage at ${lcovPath}. Run \`npm run coverage:patch\`, which measures it first.`);
    process.exit(1);
  }
  const lcov = readFileSync(lcovPath, 'utf8');

  const { passed, markdown } = formatReport(collect(parseAddedLines(diff), parseLcov(lcov)));

  console.log(markdown);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`);
  if (!passed) process.exit(1);
}
