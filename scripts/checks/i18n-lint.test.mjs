// What eslint.i18n.mjs reports, run through ESLint's own Linter: the rule as the
// configs apply it, over the shapes the repo writes. The component under test has
// a mixed-case name on purpose: the plugin skips anything inside a variable named
// in capitals, so a probe called `P` would pass everything.
import { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { i18nPlugin, i18nRules } from '../../eslint.i18n.mjs';

const linter = new Linter();

const config = [{
  files: ['**/*.tsx'],
  languageOptions: { parser: tseslint.parser },
  plugins: i18nPlugin,
  rules: i18nRules,
}];

/** How many reports a component rendering `jsx` gets. */
const reports = (jsx) => {
  const source = `export const Probe = ({ ok, x, list, t }: any) => ${jsx};`;
  return linter.verify(source, config, 'probe.tsx').map(({ fatal, message }) => {
    if (fatal) throw new Error(message);
    return message;
  }).length;
};

describe('hard-coded user-facing text', () => {
  it.each([
    ['text between tags', '<p>Hello there</p>'],
    ['a string child', `<p>{'Close it'}</p>`],
    ['a ternary child', `<p>{ok ? 'Yes it' : 'No it'}</p>`],
    ['a template literal child', '<p>{`Score: ${x}`}</p>'],
    ['a labelling attribute', '<p aria-label="Close it" />'],
    ['a labelling attribute through a ternary', `<p title={ok ? 'Open it' : 'Close it'} />`],
    ['a labelling attribute built by concatenation', `<p aria-label={'Close ' + x} />`],
    ['text in JSX passed as a prop', '<Tab label={<span>Close it</span>} />'],
  ])('reports %s', (_, jsx) => {
    expect(reports(jsx)).toBeGreaterThan(0);
  });

  it.each([
    ['text from t()', `<p aria-label={ok ? t('a') : undefined}>{t('b')}</p>`],
    ['every other attribute', `<p className="flex gap-2" data-testid="board" role="status" style={{ transform: 'translateX(-50%)' }} />`],
    ['a class name chosen inside a child callback attribute', `<p>{list.map(i => <i key={i} className={ok ? 'flex' : 'grid'} />)}</p>`],
    ['what is no word: symbols, maths, a code placeholder', `<p placeholder="111-2222-333">P(x) = x³ ✓ 🏆 · ▸{ok ? '↩️' : '🗑️'}</p>`],
  ])('leaves %s', (_, jsx) => {
    expect(reports(jsx)).toBe(0);
  });

  // The gaps README.md § The checks CI runs leaves to review. A plugin upgrade
  // that closes one fails its case here, and the README line can go.
  it.each([
    ['an attribute on an SVG element', '<circle aria-label="Field one here" />'],
    ['JSX passed through an attribute other than a label', '<Suspense fallback={<p>Loading now</p>} />'],
  ])('does not see %s', (_, jsx) => {
    expect(reports(jsx)).toBe(0);
  });
});
