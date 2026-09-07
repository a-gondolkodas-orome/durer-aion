# Contributing

Everything here is already written down somewhere. This page is the order to
read it in, and the handful of rules that were only ever tacit.

## Your first change needs no docker

The [`README.md`](README.md) opens with the competition stack — nginx, the
backend and postgres in three containers — because that is what the online round
is. Most first changes do not touch it. The practice sites run on their own:

```bash
npm ci                          # at the repository root, always — see the trap below
npm run dev:strategy-practice   # the games site, on http://localhost:8012
```

No `.env` to fill in, no database, no credentials to ask anyone for.
`npm run dev:relay-practice` and `npm run dev:offline` are the same deal, on
:5173.

Two shapes of first change fit in there:

- **A word or a screen.** The games site carries its own text as
  `{ hu: '…', en: '…' }` objects next to the code that shows it, so changing what
  a player reads is one edit in one file.
- **A new game.** One self-contained folder, and
  [`apps/strategy-practice/README.md` § *Adding a new
  game*](apps/strategy-practice/README.md#adding-a-new-game) is the recipe — it
  names the game to copy, which is the way to do this. The nearly sixty games
  already written are the other half of the documentation.

A change to the competition round itself does need the stack, and the README's
*Getting Started* is four commands to a running one.

## Before you push

```bash
npm run check
```

That is the six CI gates that need no docker, cheapest first, in two or three
minutes. CI runs a seventh, `npm run stack:build`, and the competition round
itself is walked by hand — [`README.md` § *Checking it
works*](README.md#checking-it-works) is that checklist, and says which parts a
unit test already pins.

`npm run lint` is also the formatter, so `npm run lint:fix` settles most of what
it finds. Your editor does it on save if you install the recommended extensions
— VS Code offers them from `.vscode/extensions.json` when you open the repo.

## Where your test goes

Cover new logic with a test, and pin every regression you fix with one that
fails without the fix.

**The file name decides which project runs it, and the wrong one fails quietly.**

| your file is under | name it |
| --- | --- |
| `apps/strategy-practice/src/`, `packages/strategy-engine/src/`, `packages/strategy-games/src/` | `*.spec.ts` / `*.spec.tsx` |
| any other workspace's `src/` | `*.test.ts` / `*.test.tsx` |

Get it wrong and the suite tells you which rename fixes it
(`scripts/test-file-naming.test.mjs`). Before that test existed, a `*.spec.ts` in
the wrong workspace simply never ran, and CI stayed green.

One more: **a test that writes to the console fails.** `vitest.setup.mts` says
why and how to opt out when a test means to exercise a logging path. If a
`console.log` you left in from debugging fails an unrelated assertion, that is
this.

## Commits and pull requests

Commit subjects are imperative and name the *effect*, not the file touched —
`Refuse a socket sync for a match that does not exist`, `Give nginx a TLS include
point instead of an edited config`. The pull request number is appended when the
pull request is merged; you do not write it yourself.

**Pull requests are split by atomicity, not size.** One independent change each,
so a reviewer can take or leave them separately. A big mechanical change is one
PR; two unrelated one-line fixes are two.

Fill the template in. It renders as headings with the prompts hidden in HTML
comments, so an unedited body looks deliberate and says nothing.

`.github/CODEOWNERS` requests a reviewer automatically for the strategy practice
paths. It does not cover the rest of the repository yet, so for anything else,
request one by hand — otherwise nobody is notified.

## The rest

- [`CLAUDE.md` § *Key Conventions*](CLAUDE.md#key-conventions) — the house rules
  in full: why formatting is ESLint's and not prettier's, what to comment, how
  games are laid out.
- [`apps/strategy-practice/AGENTS.md`](apps/strategy-practice/AGENTS.md) — the
  authority on everything under that directory, testing and PR scope included.
- [`README.md`](README.md) — running the round, the regression checklist,
  dependency policy, deployment.

## Traps that cost the most time

- **Never `npm ci` from inside a workspace.** There is one lockfile, at the root.
  From `apps/strategy-practice` npm installs that subtree, leaves the root's
  dependencies unmet and exits 0, and the other apps then fail to build.
- **npm must be 11.x** — the npm bundled with the Node version in `.nvmrc`, so
  `nvm use` gets you there. On any other major, every `npm run …` fails before
  your command runs.
- **`npm run setup`** creates the gitignored `.env` files from their samples. The
  `dev:*` scripts do it for you; `stack:*` does not.
- **A push to `main` deploys the public practice site.** There is no staging step
  and the checks do not gate it.
