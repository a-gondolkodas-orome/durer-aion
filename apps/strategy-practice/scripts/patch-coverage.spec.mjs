// The two parsers and the verdict are tested; the main block is a git call, a file read and an exit
// code, and a spec that mocked those would assert the mock. What could quietly mislead is a line
// counted in the wrong place — an off-by-one in a hunk header, or a .tsx file slipping into the
// measurement — which would fail a PR for lines it never wrote, the fastest way to get a check
// deleted.
import {
  collect,
  formatReport,
  intersectAddedLines,
  isMeasured,
  parseAddedLines,
  parseLcov,
  repoRelativeLcovPath
} from './patch-coverage.mjs';

describe('isMeasured', () => {
  it('measures the framework-free half of a game', () => {
    expect(isMeasured('apps/strategy-practice/src/components/games/cube-coloring/gameplay.ts')).toBe(true);
    expect(isMeasured('apps/strategy-practice/src/components/games/cube-coloring/bot-strategy.ts')).toBe(true);
  });

  it('measures the engine package — this suite is where its specs run', () => {
    expect(isMeasured('packages/engine/src/reducer.ts')).toBe(true);
    expect(isMeasured('packages/engine/src/reducer.spec.ts')).toBe(false);
  });

  it('leaves JSX out — it is swept by renders.spec.tsx, not unit-tested', () => {
    expect(isMeasured('apps/strategy-practice/src/components/games/cube-coloring/cube-coloring.tsx')).toBe(false);
    expect(isMeasured('apps/strategy-practice/src/components/games/cube-coloring/board-client.tsx')).toBe(false);
  });

  it('leaves out specs, test helpers and everything outside the measured roots', () => {
    expect(isMeasured('apps/strategy-practice/src/components/games/cube-coloring/gameplay.spec.ts')).toBe(false);
    expect(isMeasured('apps/strategy-practice/src/test-utils.ts')).toBe(false);
    expect(isMeasured('apps/strategy-practice/src/test-setup.ts')).toBe(false);
    expect(isMeasured('apps/strategy-practice/scripts/patch-coverage.mjs')).toBe(false);
    expect(isMeasured('apps/strategy-practice/vite.config.js')).toBe(false);
    // The rest of the monorepo has its own CI; measuring its diffs here would gate
    // other apps' code on this app's specs.
    expect(isMeasured('packages/schemas/src/model.ts')).toBe(false);
    expect(isMeasured('apps/online-backend/src/server.ts')).toBe(false);
  });
});

describe('repoRelativeLcovPath', () => {
  it("prefixes this app's own records", () => {
    expect(repoRelativeLcovPath('src/components/games/gameList.ts'))
      .toBe('apps/strategy-practice/src/components/games/gameList.ts');
  });

  it("resolves the engine's ../../ records to the repo root", () => {
    expect(repoRelativeLcovPath('../../packages/engine/src/reducer.ts'))
      .toBe('packages/engine/src/reducer.ts');
  });
});

describe('parseAddedLines', () => {
  it('reads a hunk header as a run of added lines starting at the given line', () => {
    const diff = ['--- a/src/a.ts', '+++ b/src/a.ts', '@@ -12,0 +13,3 @@', '+one', '+two', '+three'].join('\n');

    expect(parseAddedLines(diff).get('src/a.ts')).toEqual(new Set([13, 14, 15]));
  });

  it('reads an omitted count as a single line', () => {
    const diff = ['--- a/src/a.ts', '+++ b/src/a.ts', '@@ -12 +13 @@', '+one'].join('\n');

    expect(parseAddedLines(diff).get('src/a.ts')).toEqual(new Set([13]));
  });

  it('collects every hunk of a file, and keeps files apart', () => {
    const diff = [
      '--- a/src/a.ts',
      '+++ b/src/a.ts',
      '@@ -1,0 +2,2 @@',
      '+one',
      '+two',
      '@@ -20,0 +30,1 @@',
      '+three',
      'diff --git a/src/b.ts b/src/b.ts',
      '--- a/src/b.ts',
      '+++ b/src/b.ts',
      '@@ -5,0 +6,1 @@',
      '+four'
    ].join('\n');
    const added = parseAddedLines(diff);

    expect(added.get('src/a.ts')).toEqual(new Set([2, 3, 30]));
    expect(added.get('src/b.ts')).toEqual(new Set([6]));
  });

  it('ignores a deleted file rather than attributing its hunk to the file before it', () => {
    const diff = [
      '--- a/src/a.ts',
      '+++ b/src/a.ts',
      '@@ -1,0 +2,1 @@',
      '+one',
      'diff --git a/src/gone.ts b/src/gone.ts',
      '--- a/src/gone.ts',
      '+++ /dev/null',
      '@@ -1,4 +0,0 @@'
    ].join('\n');
    const added = parseAddedLines(diff);

    expect(added.get('src/a.ts')).toEqual(new Set([2]));
    expect(added.has('src/gone.ts')).toBe(false);
  });
});

describe('intersectAddedLines', () => {
  const lines = entries => new Map(entries.map(([path, numbers]) => [path, new Set(numbers)]));

  it('keeps a line the branch added against both comparisons', () => {
    const own = intersectAddedLines(lines([['src/a.ts', [1, 2, 3]]]), lines([['src/a.ts', [2, 3, 9]]]));

    expect(own.get('src/a.ts')).toEqual(new Set([2, 3]));
  });

  it('drops a file the branch only added against its base — the merge brought it in', () => {
    const own = intersectAddedLines(lines([['src/a.ts', [1]], ['src/merged.ts', [1, 2]]]), lines([['src/a.ts', [1]]]));

    expect(own.has('src/merged.ts')).toBe(false);
    expect(own.get('src/a.ts')).toEqual(new Set([1]));
  });

  it('drops a file whose lines all came from elsewhere rather than leaving it empty', () => {
    const own = intersectAddedLines(lines([['src/a.ts', [1, 2]]]), lines([['src/a.ts', [7]]]));

    expect(own.has('src/a.ts')).toBe(false);
  });

  it('is the identity when the branch merged nothing in — every ordinary PR', () => {
    const added = lines([['src/a.ts', [1, 2]], ['src/b.ts', [9]]]);

    expect(intersectAddedLines(added, added)).toEqual(added);
  });
});

describe('parseLcov', () => {
  it('reads hit counts per line and keeps records apart', () => {
    const lcov = [
      'SF:src/a.ts',
      'DA:1,4',
      'DA:2,0',
      'end_of_record',
      'SF:src/b.ts',
      'DA:1,1',
      'end_of_record'
    ].join('\n');
    const hits = parseLcov(lcov);

    expect(hits.get('src/a.ts')).toEqual(new Map([[1, 4], [2, 0]]));
    expect(hits.get('src/b.ts')).toEqual(new Map([[1, 1]]));
  });
});

describe('collect', () => {
  const hits = parseLcov(
    [
      'SF:apps/strategy-practice/src/a.ts', 'DA:1,3', 'DA:2,0', 'DA:4,0', 'end_of_record',
      'SF:apps/strategy-practice/src/b.ts', 'DA:9,2', 'end_of_record'
    ].join('\n')
  );

  it('splits added lines into measured and never-reached', () => {
    const files = collect(new Map([['apps/strategy-practice/src/a.ts', new Set([1, 2, 4])]]), hits);

    expect(files).toEqual([
      { path: 'apps/strategy-practice/src/a.ts', measured: 3, uncovered: [2, 4], unloaded: false }
    ]);
  });

  it('skips an added line with no DA record — a blank, a comment or a type-only declaration', () => {
    const files = collect(new Map([['apps/strategy-practice/src/a.ts', new Set([1, 2, 3])]]), hits);

    expect(files).toEqual([{ path: 'apps/strategy-practice/src/a.ts', measured: 2, uncovered: [2], unloaded: false }]);
  });

  it('drops a file the report does not mention rather than counting it as uncovered', () => {
    expect(collect(new Map([['apps/strategy-practice/src/types.ts', new Set([1, 2])]]), hits)).toEqual([]);
  });

  // An empty lcov record, not a missing one: v8 sees only the files something imported, and
  // coverage.include adds the rest as records with no DA lines. Dropping those would let a module
  // nothing in the repo touches pass as "nothing to measure".
  it('flags a file whose record has no lines at all rather than dropping it', () => {
    const withEmpty = parseLcov([
      'SF:apps/strategy-practice/src/a.ts', 'DA:1,3', 'end_of_record',
      'SF:apps/strategy-practice/src/new.ts', 'end_of_record'
    ].join('\n'));
    const files = collect(new Map([['apps/strategy-practice/src/new.ts', new Set([1, 2, 3])]]), withEmpty);

    expect(files).toEqual([{ path: 'apps/strategy-practice/src/new.ts', measured: 0, uncovered: [], unloaded: true }]);
  });

  it('drops a file whose added lines are all unmeasurable', () => {
    expect(collect(new Map([['apps/strategy-practice/src/b.ts', new Set([3, 4])]]), hits)).toEqual([]);
  });

  it('never measures JSX', () => {
    const jsxHits = parseLcov(['SF:apps/strategy-practice/src/a.tsx', 'DA:1,0', 'end_of_record'].join('\n'));

    expect(collect(new Map([['apps/strategy-practice/src/a.tsx', new Set([1])]]), jsxHits)).toEqual([]);
  });

  it('puts the worst file first', () => {
    const files = collect(new Map([
      ['apps/strategy-practice/src/b.ts', new Set([9])],
      ['apps/strategy-practice/src/a.ts', new Set([1, 2, 4])]
    ]), hits);

    expect(files.map(({ path }) => path))
      .toEqual(['apps/strategy-practice/src/a.ts', 'apps/strategy-practice/src/b.ts']);
  });
});

describe('formatReport', () => {
  const file = (path, measured, uncovered) => ({ path, measured, uncovered, unloaded: false });
  const unloadedFile = path => ({ path, measured: 0, uncovered: [], unloaded: true });
  const uncoveredLines = count => Array.from({ length: count }, (_, i) => i + 1);

  it('says there is nothing to measure when the PR adds no logic', () => {
    const { passed, markdown } = formatReport([]);

    expect(passed).toBe(true);
    expect(markdown).toBe('No non-JSX source lines added — nothing to measure.');
  });

  it('passes a fully covered diff without printing a table', () => {
    const { passed, markdown } = formatReport([file('src/a.ts', 40, [])]);

    expect(passed).toBe(true);
    expect(markdown).toContain('**100%** of the 40 non-JSX lines this PR adds are reached by a spec.');
    expect(markdown).not.toContain('| file |');
  });

  it('fails a diff below the bar and names the lines that never ran', () => {
    const { passed, markdown } = formatReport([file('src/a.ts', 40, [7, 8, 9, 10, 11, 12, 13, 14, 15, 16])]);

    expect(passed).toBe(false);
    expect(markdown).toContain('**75%** of the 40 non-JSX lines');
    expect(markdown).toContain('| `src/a.ts` | 40 | 7, 8, 9, 10, 11, 12, 13, 14 … +2 more |');
    expect(markdown).toContain('Below the 85% bar.');
  });

  it('passes a diff that is only just above the bar', () => {
    const { passed } = formatReport([file('src/a.ts', 40, uncoveredLines(6))]);

    expect(passed).toBe(true);
  });

  it('reports a small diff but never fails it', () => {
    const { passed, markdown } = formatReport([file('src/a.ts', 19, uncoveredLines(19))]);

    expect(passed).toBe(true);
    expect(markdown).toContain('**0%** of the 19 non-JSX lines');
    expect(markdown).toContain('| `src/a.ts` | 19 |');
  });

  it('fails the same ratio once the diff is big enough to mean something', () => {
    expect(formatReport([file('src/a.ts', 20, uncoveredLines(20))]).passed).toBe(false);
  });

  it('totals across files rather than judging each one', () => {
    const { passed, markdown } = formatReport([file('src/a.ts', 40, uncoveredLines(5)), file('src/b.ts', 60, [])]);

    expect(passed).toBe(true);
    expect(markdown).toContain('**95%** of the 100 non-JSX lines');
  });

  it('lists only the files with something to flag', () => {
    const { markdown } = formatReport([file('src/a.ts', 10, uncoveredLines(9)), file('src/b.ts', 90, [])]);

    expect(markdown).toContain('| `src/a.ts` |');
    expect(markdown).not.toContain('| `src/b.ts` |');
  });

  it('names a file nothing loaded instead of reporting the PR as unmeasurable', () => {
    const { passed, markdown } = formatReport([unloadedFile('src/new-game/bot-strategy.ts')]);

    expect(markdown).toContain('No non-JSX source lines added — nothing to measure.');
    expect(markdown).toContain('`src/new-game/bot-strategy.ts`');
    expect(markdown).toContain('nothing in the repo imports it');
    // Type-only modules land here too and are not a defect, so this reports rather than fails.
    expect(passed).toBe(true);
  });

  it('names it alongside a measured verdict as well', () => {
    const covered = formatReport([file('src/a.ts', 40, []), unloadedFile('src/new.ts')]);
    const failing = formatReport([file('src/a.ts', 40, uncoveredLines(20)), unloadedFile('src/new.ts')]);

    expect(covered.markdown).toContain('`src/new.ts`');
    expect(failing.markdown).toContain('`src/new.ts`');
    expect(failing.passed).toBe(false);
  });

  it('says failing means not unit-tested, not untested', () => {
    const { markdown } = formatReport([file('src/a.ts', 40, uncoveredLines(20))]);

    expect(markdown).toContain('plays-to-an-end sweep');
    expect(markdown).toContain('skip coverage');
  });
});
