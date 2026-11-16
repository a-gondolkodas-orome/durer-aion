// @ts-check

// Hard-coded text between JSX tags, for both ESLint configs; README.md § The
// checks CI runs says what it leaves to convention. `jsx-text-only` because the
// plugin's attribute-reading mode reports every string under a JSX element, class
// names included. A string with no two letters in a row (`x³`, `✓`) is no word.
import i18next from 'eslint-plugin-i18next';

export const i18nPlugin = { i18next };

export const i18nRules = {
  'i18next/no-literal-string': ['error', { mode: 'jsx-text-only', words: { exclude: [/^(?![^]*\p{L}\p{L})/u] } }],
};
