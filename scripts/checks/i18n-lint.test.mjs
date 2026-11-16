// What eslint.i18n.mjs reports, run through ESLint's own Linter: the two rules as
// the configs apply them, over the shapes the repo writes.
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

/** Each report on a component rendering `jsx`: the rule, and the source it points at. */
const reported = (jsx) => {
  const source = `export const Probe = ({ ok }: { ok: boolean }) => ${jsx};`;
  return linter.verify(source, config, 'probe.tsx').map(({ ruleId, fatal, message, column, endColumn }) => {
    if (fatal) throw new Error(message);
    return [ruleId, source.slice(column - 1, endColumn - 1)];
  });
};

describe('hard-coded user-facing text', () => {
  it('reports text between tags', () => {
    expect(reported('<p>Hello there</p>')).toEqual([
      ['i18next/no-literal-string', 'Hello there'],
    ]);
  });

  it('reports a labelling attribute, through the choices that pick its value', () => {
    expect(reported(
      '<div aria-label="Bezárás" title={ok ? `Field ${1}` : "x"} placeholder={ok && "Neved"} />'
    )).toEqual([
      ['i18n/no-literal-attribute', '"Bezárás"'],
      ['i18n/no-literal-attribute', '`Field ${1}`'],
      ['i18n/no-literal-attribute', '"Neved"'],
    ]);
  });

  it('leaves what is no word: symbols, maths, a variable, a code placeholder', () => {
    expect(reported(
      '<div label="a" placeholder="111-2222-333"><span>P(x) = x³ ✓ 🏆 · ▸</span>{ok ? "↩️" : "🗑️"}</div>'
    )).toEqual([]);
  });

  it('leaves text from t(), and every other attribute', () => {
    expect(reported(
      '<div aria-label={t("label")} className="flex gap-2" data-testid="board" role="status">{t("text")}</div>'
    )).toEqual([]);
  });
});
