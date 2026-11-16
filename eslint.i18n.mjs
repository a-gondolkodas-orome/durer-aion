// @ts-check

// Hard-coded user-facing text in JSX, for both ESLint configs; README.md § The
// checks CI runs says what it still leaves to review. `jsx-only` reads every
// string under a JSX element: its text, a `{'…'}` or ternary child, a template
// literal. Attributes are left out but for the ones a reader sees or hears,
// because the rest hold class names, styles and keys; `include` wins over
// `exclude`. Even an included attribute is skipped on an SVG element or `<a>`,
// and on an HTML tag only `aria-label`, `title`, `placeholder` and `alt` are read
// (the plugin's `isAllowedDOMAttr`); a component's are all read. A string with no
// two letters in a row (`x³`, `✓`) is no word.
//
// A string computed inside a JSX callback, a `.map` over pieces say, is under the
// element too: a class name or style built there belongs in a helper outside it.
import i18next from 'eslint-plugin-i18next';

export const i18nPlugin = { i18next };

export const i18nRules = {
  'i18next/no-literal-string': ['error', {
    mode: 'jsx-only',
    'jsx-attributes': {
      include: [
        'alt',
        'aria-description',
        'aria-label',
        'aria-roledescription',
        'aria-valuetext',
        'helperText',
        'label',
        'placeholder',
        'title',
      ],
      exclude: ['.*'],
    },
    'should-validate-template': true,
    words: { exclude: [/^(?![^]*\p{L}\p{L})/u] },
  }],
};
