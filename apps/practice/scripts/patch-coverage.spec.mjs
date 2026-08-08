// The two parsers and the verdict are tested; the main block is a git call, a file read and an exit
// code, and a spec that mocked those would assert the mock. What could quietly mislead is a line
// counted in the wrong place — an off-by-one in a hunk header, or a .tsx file slipping into the
// measurement — which would fail a PR for lines it never wrote, the fastest way to get a check
// deleted.
import { collect, formatReport, isMeasured, parseAddedLines, parseLcov } from './patch-coverage.mjs';

describe('isMeasured', () => {
  it('measures the framework-free half of a game', () => {
    expect(isMeasured('src/components/games/cube-coloring/gameplay.ts')).toBe(true);
    expect(isMeasured('src/components/games/cube-coloring/bot-strategy.ts')).toBe(true);
  });

  it('leaves JSX out — it is swept by renders.spec.tsx, not unit-tested', () => {
    expect(isMeasured('src/components/games/cube-coloring/cube-coloring.tsx')).toBe(false);
    expect(isMeasured('src/components/games/cube-coloring/board-client.tsx')).toBe(false);
  });

  it('leaves out specs, test helpers and anything outside src/', () => {
    expect(isMeasured('src/components/games/cube-coloring/gameplay.spec.ts')).toBe(false);
    expect(isMeasured('src/test-utils.ts')).toBe(false);
    expect(isMeasured('src/test-setup.ts')).toBe(false);
    expect(isMeasured('scripts/patch-coverage.mjs')).toBe(false);
    expect(isMeasured('vite.config.js')).toBe(false);
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
    ['SF:src/a.ts', 'DA:1,3', 'DA:2,0', 'DA:4,0', 'end_of_record', 'SF:src/b.ts', 'DA:9,2', 'end_of_record'].join('\n')
  );

  it('splits added lines into measured and never-reached', () => {
    const files = collect(new Map([['src/a.ts', new Set([1, 2, 4])]]), hits);

    expect(files).toEqual([{ path: 'src/a.ts', measured: 3, uncovered: [2, 4], unloaded: false }]);
  });

  it('skips an added line with no DA record — a blank, a comment or a type-only declaration', () => {
    const files = collect(new Map([['src/a.ts', new Set([1, 2, 3])]]), hits);

    expect(files).toEqual([{ path: 'src/a.ts', measured: 2, uncovered: [2], unloaded: false }]);
  });

  it('drops a file the report does not mention rather than counting it as uncovered', () => {
    expect(collect(new Map([['src/types.ts', new Set([1, 2])]]), hits)).toEqual([]);
  });

  // An empty lcov record, not a missing one: v8 sees only the files something imported, and
  // coverage.include adds the rest as records with no DA lines. Dropping those would let a module
  // nothing in the repo touches pass as "nothing to measure".
  it('flags a file whose record has no lines at all rather than dropping it', () => {
    const withEmpty = parseLcov(['SF:src/a.ts', 'DA:1,3', 'end_of_record', 'SF:src/new.ts', 'end_of_record'].join('\n'));
    const files = collect(new Map([['src/new.ts', new Set([1, 2, 3])]]), withEmpty);

    expect(files).toEqual([{ path: 'src/new.ts', measured: 0, uncovered: [], unloaded: true }]);
  });

  it('drops a file whose added lines are all unmeasurable', () => {
    expect(collect(new Map([['src/b.ts', new Set([3, 4])]]), hits)).toEqual([]);
  });

  it('never measures JSX', () => {
    const jsxHits = parseLcov(['SF:src/a.tsx', 'DA:1,0', 'end_of_record'].join('\n'));

    expect(collect(new Map([['src/a.tsx', new Set([1])]]), jsxHits)).toEqual([]);
  });

  it('puts the worst file first', () => {
    const files = collect(new Map([['src/b.ts', new Set([9])], ['src/a.ts', new Set([1, 2, 4])]]), hits);

    expect(files.map(({ path }) => path)).toEqual(['src/a.ts', 'src/b.ts']);
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
