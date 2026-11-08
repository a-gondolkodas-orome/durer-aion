// The network lookups are not tested: a spec that mocked them would assert the mock. What is left
// is where the report could quietly mislead — the sorting into routine, major and held rows, a
// failed lookup dropped instead of reported; the lockfile lookup, which decides which copy of a
// package a workspace runs; and newestTagInLine, which parses a tag list Docker Hub hands over in
// an order that is not the one we want.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { HELD_BACK, findResolved, formatReport, newestTagInLine } from './dependency-report.mjs';

const row = (name, current, latest, where = ['root']) => ({ name, current, latest, where });

// The report's `### <title>` section, up to the next one.
const section = (report, title) => report.split('### ').find(part => part.startsWith(title)) ?? '';

describe('formatReport', () => {
  it('says so plainly when nothing is behind', () => {
    expect(formatReport([row('vite', '8.1.5', '8.1.5'), row('eslint', '10.8.0', '10.8.0')]))
      .toBe('Every pinned version is current — 2 checked, nothing behind.');
  });

  it('sorts the behind rows into routine, major and held, each with where it is written down', () => {
    const report = formatReport([
      row('vite', '8.1.5', '8.2.1', ['root', 'packages/game']),
      // apps/strategy-practice runs ahead on some pins deliberately: two versions, two upgrades.
      row('eslint', '10.8.0', '10.9.0'),
      row('eslint', '10.8.5', '10.9.0', ['apps/strategy-practice']),
      // A hold is on the major: a patch inside the held version is as routine as any other.
      row('koa', '2.16.4', '2.16.5', ['apps/online-backend']),
      // Action tags compare past the leading v.
      row('actions/cache', 'v4', 'v6', ['ci.yml']),
      row('actions/checkout', 'v7', 'v7', ['ci.yml']),
      // #409: a hold already argued out is not one of the majors waiting.
      row('typescript', '6.0.3', '7.0.2'),
      row('postcss', '8.5.23', '8.5.23')
    ]);

    expect(report).toContain('6 of 8 pinned versions are behind, 1 of them held back deliberately.');

    const routine = section(report, 'Patch and minor (4)');
    expect(routine).toContain('`npm run update:minors`');
    expect(routine).toContain('| `vite` | 8.1.5 | 8.2.1 | root, packages/game |');
    expect(routine).toContain('| `eslint` | 10.8.0 | 10.9.0 | root |');
    expect(routine).toContain('| `eslint` | 10.8.5 | 10.9.0 | apps/strategy-practice |');
    expect(routine).toContain('| `koa` | 2.16.4 | 2.16.5 | apps/online-backend |');

    expect(section(report, 'Major (1)')).toContain('| `actions/cache` | v4 | v6 | ci.yml |');

    const held = section(report, 'Held back deliberately (1)');
    expect(held).toContain('| | pinned | latest | written down in | held back by |');
    expect(held).toContain(`| \`typescript\` | 6.0.3 | 7.0.2 | root | ${HELD_BACK.typescript} |`);
  });

  // A failed lookup that left nothing else behind must not read as "everything is current".
  it('reports a failed lookup rather than dropping the row', () => {
    const report = formatReport([
      { name: 'actions/cache', current: 'v6', where: ['ci.yml'], error: 'HTTP 403' },
      row('vite', '8.1.5', '8.1.5')
    ]);

    expect(report).toContain('0 of 2 pinned versions are behind.');
    expect(section(report, 'Could not check (1)')).toContain('- `actions/cache` (pinned v6 in ci.yml): HTTP 403');
  });
});

// npm nests a version under a workspace precisely when the hoisted one is somebody else's, so
// preferring the root would report another workspace's version as if it were this one's.
it('findResolved prefers the copy nested under the workspace asking, then the hoisted one', () => {
  const lockfile = {
    packages: {
      'node_modules/typescript': { version: '5.9.3' },
      'apps/strategy-practice/node_modules/typescript': { version: '6.0.3' },
      'node_modules/vite': { version: '8.2.1' }
    }
  };

  expect(findResolved(lockfile, 'typescript', 'apps/strategy-practice')).toBe('6.0.3');
  expect(findResolved(lockfile, 'vite', 'apps/strategy-practice')).toBe('8.2.1');
  expect(findResolved(lockfile, 'typescript')).toBe('5.9.3');
  expect(findResolved(lockfile, 'rollup')).toBeUndefined();
});

// The report's captions and DEPENDENCIES.md § Held back deliberately are two lists of the same
// holds, and only DEPENDENCIES.md argues them. Lifting one there and forgetting the other would
// leave the next monthly issue still calling a finished hold a hold.
it('HELD_BACK names the same packages as DEPENDENCIES.md § Held back deliberately', () => {
  const doc = readFileSync(fileURLToPath(new URL('../docs/DEPENDENCIES.md', import.meta.url)), 'utf8');
  const documented = [...(doc.split('## Held back deliberately')[1]?.split(/^#/m)[0] ?? '').matchAll(/^- \*\*`([^`]+)`/gm)]
    .map(([, name]) => name);

  expect(documented.sort()).toEqual(Object.keys(HELD_BACK).sort());
});

// Docker Hub answers newest-*pushed* first and with every variant of every tag, so the list below is
// in the order it really returns them — the real 1.30 page had 1.31.4 above the pinned 1.30.4.
describe('newestTagInLine', () => {
  const nginxTags = [
    '1.30.4-trixie-perl', '1.30-perl', '1.31.4-perl', '1.30.4-trixie', '1.30.4', '1.30',
    '1.31.4-trixie', '1.31.4', '1.31', '1.30.4-alpine3.24', '1.30.4-alpine', '1.30.3', '1.30.0'
  ];

  it('takes the newest bare tag in the pinned line, at the pin\'s precision', () => {
    // Not a variant, and not the mainline 1.31.x: offering that would be a decision, not a bump.
    expect(newestTagInLine(nginxTags, '1.30.0', 2)).toBe('1.30.4');
    // `1.30` is a moving alias, not a version to pin to — and a pin written that way stays one.
    expect(newestTagInLine(nginxTags, '1.30', 2)).toBe('1.30');
    expect(newestTagInLine(['24.20.0', '24.20', '24.19.0', '26.8.1'], '24.19.0', 1)).toBe('24.20.0');
    // Numerically, not as text.
    expect(newestTagInLine(['17.9', '17.11', '17.10'], '17.9', 1)).toBe('17.11');
    // postgres publishes `19beta3` beside its releases; failing on it would read as "could not check".
    expect(newestTagInLine(['18.6', '19beta3', '18.5'], '18.5', 1)).toBe('18.6');
  });

  // A failed lookup counts as behind: the report must never stay quiet about a version it could
  // not check.
  it('throws rather than inventing a version when the line has no tag', () => {
    expect(() => newestTagInLine(['1.31.4', '1.29.0'], '1.30.4', 2)).toThrow('no 1.30.x tag found');
  });
});
