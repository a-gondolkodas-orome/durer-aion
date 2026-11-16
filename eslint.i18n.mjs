// @ts-check

// Hard-coded user-facing text, shared by this repo's two ESLint configs the way
// eslint.stylistic.mjs is. Text a reader sees or hears goes through i18next's
// `t()` or `<Trans>`; these two rules catch the places it was typed in instead.
//
// eslint-plugin-i18next's rule reads JSX text only: its `jsx-only` mode, the one
// that also reads attributes, reports every string anywhere under a JSX element —
// the class names and style values of a board's callbacks — and an attribute
// cannot be read on its own without silencing the text beside it. So the plugin
// keeps to text, and `no-literal-attribute` below reads the attributes that are
// read out or shown: labels, titles, placeholders, alt text.
//
// One blind spot is the plugin's: it reads a variable named in capitals as a
// constant and checks nothing inside it, so `const LABELS = <>…</>` passes.
//
// What the configs leave out, and why, is where they apply these rules.
import i18next from 'eslint-plugin-i18next';

// A string with no two letters in a row is not a word in any language: a digit,
// a symbol, an arrow, `x³`, a maths variable named `a`, a code placeholder such as
// `111-2222-333`. Shared by both rules, so the two agree on what counts as text.
const HAS_WORD = /\p{L}\p{L}/u;
const NO_WORD = /^(?![^]*\p{L}\p{L})/u;

const LABELLING_ATTRIBUTES = new Set([
  'alt',
  'aria-description',
  'aria-label',
  'aria-roledescription',
  'aria-valuetext',
  'helperText',
  'label',
  'placeholder',
  'title',
]);

/**
 * The string literals an attribute's value can evaluate to, followed through the
 * shapes that pick between them: `cond ? 'a' : 'b'`, `cond && 'a'`, `x ?? 'a'`.
 * @param {any} node
 * @returns {any[]}
 */
const literalsOf = (node) => {
  switch (node.type) {
    case 'Literal':
      return typeof node.value === 'string' && HAS_WORD.test(node.value) ? [node] : [];
    case 'TemplateLiteral':
      return node.quasis.some((/** @type {any} */ quasi) => HAS_WORD.test(quasi.value.cooked ?? '')) ? [node] : [];
    case 'JSXExpressionContainer':
      return literalsOf(node.expression);
    case 'ConditionalExpression':
      return [...literalsOf(node.consequent), ...literalsOf(node.alternate)];
    case 'LogicalExpression':
      return literalsOf(node.right);
    default:
      return [];
  }
};

/** @type {import('eslint').Rule.RuleModule} */
const noLiteralAttribute = {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow hard-coded text in the JSX attributes a reader sees or hears' },
    schema: [],
    messages: {
      literal: 'The `{{name}}` attribute is shown or read out to the user: give it text from t(), not a literal.',
    },
  },
  create: context => ({
    /** @param {any} node */
    JSXAttribute(node) {
      if (node.name.type !== 'JSXIdentifier' || !LABELLING_ATTRIBUTES.has(node.name.name) || !node.value) return;
      for (const literal of literalsOf(node.value)) {
        context.report({ node: literal, messageId: 'literal', data: { name: node.name.name } });
      }
    },
  }),
};

export const i18nPlugin = {
  i18next,
  i18n: { rules: { 'no-literal-attribute': noLiteralAttribute } },
};

export const i18nRules = {
  'i18next/no-literal-string': ['error', {
    mode: 'jsx-text-only',
    words: { exclude: [NO_WORD] },
    message: 'Text shown to the user comes from t() or <Trans>, not a literal',
  }],
  'i18n/no-literal-attribute': 'error',
};
