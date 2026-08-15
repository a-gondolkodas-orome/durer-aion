// Only formatReport is tested: the rest of dependency-report.mjs is three network lookups, and a
// spec that mocked them would assert the mock. The sorting into patch/minor vs major, and the
// handling of a failed lookup, are where the report could quietly mislead — a row dropped instead
// of reported would read as "up to date".
import { formatReport } from './dependency-report.mjs';

const row = (name, current, latest) => ({ name, current, latest });

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
      row('typescript', '6.0.3', '7.0.2')
    ]);

    expect(report).toContain('### Patch and minor (2)');
    expect(report).toContain('### Major (1)');
    expect(report.indexOf('`vite`')).toBeLessThan(report.indexOf('### Major'));
    expect(report.indexOf('`typescript`')).toBeGreaterThan(report.indexOf('### Major'));
  });

  it('compares majors past the leading v, so an action tag is not read as a bump', () => {
    const report = formatReport([row('actions/checkout', 'v7', 'v7'), row('actions/cache', 'v4', 'v6')]);

    expect(report).toContain('### Major (1)');
    expect(report).toContain('| `actions/cache` | v4 | v6 |');
  });

  it('omits a section that has no rows', () => {
    const report = formatReport([row('postcss', '8.5.23', '8.5.26')]);

    expect(report).toContain('### Patch and minor (1)');
    expect(report).not.toContain('### Major');
  });

  it('warns on the two versions that are written down in more than one file', () => {
    const report = formatReport([
      row('playwright', '1.62.0', '1.62.1'),
      row('Node (.nvmrc)', '24.11.1', '24.19.0'),
      row('vite', '8.1.5', '8.2.1')
    ]);

    expect(report).toContain('`playwright` <br> ⚠️ .devcontainer/Dockerfile too');
    expect(report).toContain('`Node (.nvmrc)` <br> ⚠️ 5 files — see README');
    expect(report).toContain('| `vite` | 8.1.5 | 8.2.1 |');
  });

  it('reports a failed lookup rather than dropping the row', () => {
    const report = formatReport([
      { name: 'actions/cache', current: 'v6', error: 'HTTP 403' },
      row('vite', '8.1.5', '8.1.5')
    ]);

    expect(report).toContain('### Could not check (1)');
    expect(report).toContain('- `actions/cache` (pinned v6): HTTP 403');
  });

  it('does not claim everything is current when a lookup failed and nothing else is behind', () => {
    const report = formatReport([
      { name: 'actions/cache', current: 'v6', error: 'HTTP 403' },
      row('vite', '8.1.5', '8.1.5')
    ]);

    expect(report).not.toContain('nothing behind');
    expect(report).toContain('0 of 2 pinned versions are behind.');
  });
});
