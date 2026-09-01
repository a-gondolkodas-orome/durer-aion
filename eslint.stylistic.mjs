// @ts-check

// The character-level formatting rules, shared by this repo's two ESLint configs
// so that a file's spelling does not depend on which one lints it. This is the
// cross-workspace half of what apps/strategy-practice's config calls `houseStyle`;
// that file adds its own on top.
//
// The rule for what belongs here: it may fix characters, never line breaks.
// Spacing, blank lines, final newlines — all of it rewrites a line in place. Rules
// that decide where a line *breaks* are the other kind, and they stay
// per-workspace, where `layout` in apps/strategy-practice's config explains why:
// the same rules that read well over nested JSX explode a hand-aligned matrix into
// one entry per line. That distinction is checkable, and worth checking on anything
// added below: applied to the whole repo, exactly one file changed line count.
//
// It is also why prettier is not here. Prettier re-prints each file from its AST,
// so it decides every break itself and cannot tell a board written as a grid, or
// assertions aligned to be read side by side, from an accident. Measured on this
// tree it rewrote 661 files where these rules rewrite 112.
//
// @stylistic rather than eslint core: core's formatting rules — `quotes`, `semi`,
// `indent`, `max-len` and the rest — are deprecated and frozen, and @stylistic is
// where they are maintained. Its versions also reach TypeScript where core's
// stopped, which is a gain and, in two places, a hazard worth naming.
import stylistic from '@stylistic/eslint-plugin';

export const stylisticPlugin = { '@stylistic': stylistic };

export const stylisticRules = {
  // Whitespace nobody chooses on purpose.
  '@stylistic/no-trailing-spaces': 'error',
  '@stylistic/eol-last': 'error',
  '@stylistic/no-multiple-empty-lines': ['error', { max: 2 }],
  '@stylistic/space-in-parens': 'error',
  '@stylistic/no-whitespace-before-property': 'error',

  // Spacing around syntax, so that `a+b` and `}else{` cannot slip in.
  '@stylistic/space-infix-ops': 'error',
  '@stylistic/keyword-spacing': 'error',
  '@stylistic/space-before-blocks': 'error',
  '@stylistic/arrow-spacing': 'error',
  '@stylistic/comma-spacing': 'error',
  '@stylistic/semi-spacing': 'error',
  '@stylistic/key-spacing': 'error',
  '@stylistic/object-curly-spacing': ['error', 'always'],

  // Two rules that would pass the test above on paper and are still left out:
  //
  // `semi` is harmless in kind, but was 431 lines across 215 files on its own —
  // over half the files it would touch — and a missing semicolon at a statement
  // end is not something this repo has been confused by.
  //
  // `indent` is the one rule of this shape that re-lays-out rather than fixes. It
  // wants every `return (` JSX tree in apps/strategy-practice shifted two spaces
  // right, 966 times, against a style chosen to keep deep JSX readable.
  // .editorconfig settles indentation for new code instead, in every editor,
  // without rewriting the old.
};

// Quote style, applied where the code already agrees on one rather than everywhere.
// apps/strategy-practice has enforced single quotes across its 487 files all along,
// and packages/engine and packages/games — that app's code, moved out — follow it
// with no violations. Turning it on there costs nothing and keeps it true.
//
// The other eight workspaces never had the rule and never settled on a style:
// packages/common-frontend is 18 files single-quoted, 16 double-quoted and 10 that
// mix both, api-repository-interface.ts on adjacent import lines. Normalising them
// is 1040 lines that would say nothing about what the code does, and picking their
// style is a decision to take on its own rather than inside a formatting change.
// It is one more `files` entry below when someone wants to.
//
// JSX attributes are governed by `jsx-quotes`, not this rule, so `<Foo bar="x">` is
// untouched wherever it applies.
export const quotesRule = {
  '@stylistic/quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: 'always' }],
};

// Generated lookup tables are pasted verbatim from their generators' output, and
// their generators have to reproduce them byte for byte — so the formatting rules
// are off for them while every rule about meaning still applies. Turning the rules
// off by name, rather than ignoring the files, is what keeps that distinction.
//
// Built over both sets: remove-divisor-multiple's table is inside packages/games,
// which `quotesRule` covers, and its keys are double-quoted JSON. Deriving this from
// `stylisticRules` alone would leave it exposed to the one rule it most needs off.
export const stylisticRulesOff = Object.fromEntries(
  Object.keys({ ...stylisticRules, ...quotesRule }).map(rule => [rule, 'off'])
);
