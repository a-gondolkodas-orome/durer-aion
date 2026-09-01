// Only formatReport is tested: the rest of dependency-report.mjs is three network lookups, and a
// spec that mocked them would assert the mock. The sorting into patch/minor vs major, and the
// handling of a failed lookup, are where the report could quietly mislead — a row dropped instead
// of reported would read as "up to date".
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { HELD_BACK, formatReport } from './dependency-report.mjs';

const row = (name, current, latest, where = ['root']) => ({ name, current, latest, where });

// Fixtures below name packages HELD_BACK does not, except where the hold is the point: a test
// about the major/minor split should not start failing the day a package joins or leaves that list.

describe('formatReport', () => {
  it('says so plainly when nothing is behind', () => {
    const report = formatReport([row('vite', '8.1.5', '8.1.5'), row('eslint', '10.8.0', '10.8.0')]);

    expect(report).toBe('Every pinned version is current — 2 checked, nothing behind.');
  });

  it('counts only the packages that are behind, out of all that were checked', () => {
    const report = formatReport([row('vite', '8.1.5', '8.2.1'), row('eslint', '10.8.0', '10.8.0')]);

    expect(report).toContain('1 of 2 pinned versions are behind.');
  });

  it('separates a major bump from a patch or minor one', () => {
    const report = formatReport([
      row('vite', '8.1.5', '8.2.1'),
      row('postcss', '8.5.23', '8.5.26'),
      row('eslint', '10.8.0', '11.0.0')
    ]);

    expect(report).toContain('### Patch and minor (2)');
    expect(report).toContain('### Major (1)');
    expect(report.indexOf('`vite`')).toBeLessThan(report.indexOf('### Major'));
    expect(report.indexOf('`eslint`')).toBeGreaterThan(report.indexOf('### Major'));
  });

  it('compares majors past the leading v, so an action tag is not read as a bump', () => {
    const report = formatReport([
      row('actions/checkout', 'v7', 'v7', ['ci.yml']),
      row('actions/cache', 'v4', 'v6', ['pages-deploy.yml'])
    ]);

    expect(report).toContain('### Major (1)');
    expect(report).toContain('| `actions/cache` | v4 | v6 | pages-deploy.yml |');
  });

  it('omits a section that has no rows', () => {
    const report = formatReport([row('postcss', '8.5.23', '8.5.26')]);

    expect(report).toContain('### Patch and minor (1)');
    expect(report).not.toContain('### Major');
  });

  // The column a monorepo needs and a single app did not: a bump is as big as the number of files
  // it has to touch, and that is not visible from the version alone.
  it('says where each version is written down', () => {
    const report = formatReport([
      row('typescript', '5.9.3', '7.0.2', ['root', 'packages/game', 'apps/online-frontend']),
      row('playwright', '1.62.0', '1.62.1', ['apps/strategy-practice', 'apps/strategy-practice/.devcontainer/Dockerfile'])
    ]);

    expect(report).toContain('| `typescript` | 5.9.3 | 7.0.2 | root, packages/game, apps/online-frontend |');
    expect(report).toContain('| `playwright` | 1.62.0 | 1.62.1 | apps/strategy-practice, apps/strategy-practice/.devcontainer/Dockerfile |');
  });

  // apps/strategy-practice runs ahead of the rest on several of these deliberately. Collapsing the
  // two into one row would name one version and mislead about the other; they are two upgrades.
  it('keeps one name pinned at two versions as two rows', () => {
    const report = formatReport([
      row('eslint', '10.8.0', '10.9.0', ['root', 'packages/game']),
      row('eslint', '10.8.5', '10.9.0', ['apps/strategy-practice'])
    ]);

    expect(report).toContain('2 of 2 pinned versions are behind.');
    expect(report).toContain('| `eslint` | 10.8.0 | 10.9.0 | root, packages/game |');
    expect(report).toContain('| `eslint` | 10.8.5 | 10.9.0 | apps/strategy-practice |');
  });

  it('reports a failed lookup rather than dropping the row', () => {
    const report = formatReport([
      { name: 'actions/cache', current: 'v6', where: ['.github/workflows/ci.yml'], error: 'HTTP 403' },
      row('vite', '8.1.5', '8.1.5')
    ]);

    expect(report).toContain('### Could not check (1)');
    expect(report).toContain('- `actions/cache` (pinned v6 in .github/workflows/ci.yml): HTTP 403');
  });

  it('does not claim everything is current when a lookup failed and nothing else is behind', () => {
    const report = formatReport([
      { name: 'actions/cache', current: 'v6', where: ['.github/workflows/ci.yml'], error: 'HTTP 403' },
      row('vite', '8.1.5', '8.1.5')
    ]);

    expect(report).not.toContain('nothing behind');
    expect(report).toContain('0 of 2 pinned versions are behind.');
  });

  // The report says what is behind; the maintainer should not then have to remember which script
  // does the routine half of it. Majors have their upgrade-guide note already.
  it('names the script that makes the routine bumps', () => {
    const report = formatReport([row('postcss', '8.5.23', '8.5.26')]);

    expect(report).toContain('`npm run update:minors`');
  });

  // #409: five majors were listed as if they were five upgrades, when four of them were holds this
  // repo had already argued out. Keeping them out of the Major count is the point of the section.
  it('lists a held-back major in its own section, out of the major count', () => {
    const report = formatReport([
      row('koa', '2.16.4', '3.2.1', ['apps/online-backend']),
      row('actions/setup-node', 'v5', 'v7', ['ci.yml'])
    ]);

    expect(report).toContain('### Major (1)');
    expect(report).toContain('| `actions/setup-node` | v5 | v7 | ci.yml |');
    expect(report).toContain('### Held back deliberately (1)');
    expect(report.indexOf('`koa`')).toBeGreaterThan(report.indexOf('### Held back'));
  });

  it('names the blocker in a column of its own', () => {
    const report = formatReport([row('typescript', '6.0.3', '7.0.2', ['root'])]);

    expect(report).toContain('| | pinned | latest | written down in | held back by |');
    expect(report).toContain(`| \`typescript\` | 6.0.3 | 7.0.2 | root | ${HELD_BACK.typescript} |`);
  });

  // The hold is on the major, not on the package: a release inside the version we are held at is
  // as routine as any other minor, and is not what the section is for.
  it('leaves a patch of a held-back package among the routine bumps', () => {
    const report = formatReport([row('koa', '2.16.4', '2.16.5', ['apps/online-backend'])]);

    expect(report).toContain('### Patch and minor (1)');
    expect(report).not.toContain('### Held back');
  });

  it('says in the headline how many of the behind rows are holds', () => {
    const report = formatReport([
      row('koa', '2.16.4', '3.2.1', ['apps/online-backend']),
      row('@types/node', '24.13.3', '26.4.0', ['apps/online-backend']),
      row('vite', '8.1.5', '8.2.1')
    ]);

    expect(report).toContain('3 of 3 pinned versions are behind, 2 of them held back deliberately.');
  });

  it('keeps the headline plain when nothing is held back', () => {
    const report = formatReport([row('vite', '8.1.5', '8.2.1'), row('eslint', '10.8.0', '10.8.0')]);

    expect(report).toContain('1 of 2 pinned versions are behind.');
    expect(report).not.toContain('held back');
  });
});

// The report's captions and README § Held back deliberately are two lists of the same four holds,
// and only the README argues them. Lifting one there and forgetting the other would leave the next
// monthly issue still calling a finished hold a hold — a month before anyone noticed.
describe('HELD_BACK against README', () => {
  it('names the same packages as README § Held back deliberately', () => {
    const readme = readFileSync(fileURLToPath(new URL('../README.md', import.meta.url)), 'utf8');
    const section = readme.split('### Held back deliberately')[1]?.split(/^#/m)[0] ?? '';
    const documented = [...section.matchAll(/^- \*\*`([^`]+)`/gm)].map(([, name]) => name);

    expect(documented.sort()).toEqual(Object.keys(HELD_BACK).sort());
  });
});
