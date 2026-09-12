# Durer Online Round Framework

Real-time multiplayer framework for online math competitions with interactive games, built on boardgame.io.

## Project Structure

This is a **Turborepo monorepo** with npm workspaces:

```
apps/
  online-frontend/    # React frontend for multiplayer (Vite)
  online-backend/     # Node.js server with boardgame.io + Koa
  offline-frontend/   # the offline dry run, served at /proba-verseny/ (Vite)
  relay-practise-frontend/  # the public relay practice site, served at /valto/
  strategy-practice/  # the public strategy game practice site (from the durer-jatekok repo), served at /jatekok/
packages/
  game/               # Game logic (boardgame.io games); strategy games carry their bot and board in their own folder
  relay-bot/          # the relay game's opponent: the problem bank, and what each try is worth
  common-frontend/    # Shared React components
  schemas/            # TypeScript models/types
  strategy-engine/    # the strategy practice site's game engine: rules, moves, bots, match state, no framework
  strategy-games/     # competition games in that engine's format; only strategy-practice consumes it
pages/                # static content the Pages deploy serves but no app builds
```

**"Practice" alone is ambiguous — say which one.** The *strategy practice*
site (`apps/strategy-practice`, `/jatekok/`), the *relay practice* site
(`apps/relay-practise-frontend`, `/valto/`), and the offline *dry run*
(`apps/offline-frontend`, `/proba-verseny/`) are three different apps. The
first two are the practice sites; the dry run is a rehearsal of the
competition round, not a practice site.

**`apps/strategy-practice` is a workspace, but not like the others.** One root `npm ci`
installs it, and turbo builds, typechecks and lints it with everything else — but
it keeps its own `eslint.config.js` and its own vitest config. Neither is a second
command: `npm run lint` runs one ESLint process per workspace through turbo, and
each resolves the config nearest the files it is given, so this app is linted
through *its* config and everything else through the root one; and the root
`vitest.config.mts` lists that vitest config as a second project, so one
`npm test` runs its suite next to the root's, each under its own setup. (One
`eslint .` over the whole repo did the same job in a single process, and needed
3072 MB of V8 heap to do it — `turbo.json` says what that cost and why the split.) What that ESLint config differs on is the *rule set* —
`@eslint-react`, react-hooks, and a stylistic dialect (no trailing comma,
`max-len` 120) the root does not impose. Single quotes are not part of that
difference: the root config applies the same rule to `packages/strategy-engine` and
`packages/strategy-games`, this app's code moved out. It is not a second toolchain:
eslint, typescript and vitest are pinned to the same versions as the root and
npm hoists them, its own plugins included. It came in as a subtree
merge from `durer-jatekok` with that dialect already set, and reconciling the
two would be a rewrite rather than a merge — so the two configs stay, and
ESLint applies each where it belongs. Its own [`AGENTS.md`](apps/strategy-practice/AGENTS.md) loads
automatically when you work under that directory and is the authority on
everything inside it — memory files nest by directory; settings do not.

**Do not run `npm ci` from `apps/strategy-practice`.** There is one lockfile, at the
root; from a workspace directory npm installs that workspace's subtree and
leaves the root's own dependencies unmet, which the other apps then fail to
build against. It exits 0 while doing it.

A plan to replace boardgame.io with the strategy practice engine was drafted and then
deprioritized — upstream is actively maintained again (issue #277); don't
build toward that replacement. Its remaining `npm audit` advisories are its own
transitive tree — `@koa/cors@3`, `cookie` through `react-cookies`, `svelte` —
and cannot be fixed from here. **Never run `npm audit fix --force`:** its fix for
them is `boardgame.io@0.22.1`, a four-year downgrade that would take the
competition with it. What is behind otherwise is `npm run report:outdated`'s
job, monthly.

`ws` and `engine.io` were on that list until #461 and are not any more.
boardgame.io builds its socket layer from `koa-socket-2`, which asks for
`socket.io ^3`, so npm nested a 3.x copy under it — and *that* copy, not the 4.x
one `apps/online-backend` declares, served every match. Nothing showed it: a 4.x
browser client and a 3.x server both speak Engine.IO 4, so the round worked
while the transport was type-checked against a version it was not running and
the advisories were counted against a tree nobody loaded. The `overrides` block
in the root `package.json` points `koa-socket-2`'s dependency at 4, which makes
the tree one install. Two tests keep it that way:
`scripts/socketio-single-copy.test.mjs` reads the lockfile and fails the moment a
second copy appears, and `apps/online-backend/src/socketio_transport.test.ts`
plays a match over a real socket, which is what a version change has to keep
working.

*What must keep working* below is the standing regression checklist every
change is measured against.

## Tech Stack

- **Frontend**: React 19, Vite, MUI (Material-UI), React Router
- **Backend**: boardgame.io server, Koa, PostgreSQL (via bgio-postgres)
- **Build**: Turborepo, TypeScript, tsdown. The packages build into `dist` —
  all but `packages/strategy-games`, which has no build at all, because
  `apps/strategy-practice` reads it from source through a vite alias. The
  backend is one tsdown bundle too, built from the packages' *source*
  rather than their `dist` (`apps/online-backend/tsdown.config.mts` says how
  and why), so neither its build, its dev server nor its typecheck waits on a
  package build. Each build config is `tsdown.config.mts`, not
  `.ts`: the packages carry no `"type": "module"`, which leaves node guessing
  at a `.ts` config's module system and warning about it on every build. The
  packages ship ESM only — the frontends import it and the backend bundles
  their source, so a CommonJS build would have no consumer. `packages/strategy-engine` is
  the exception: it is CJS-typed and builds both formats, so a host that
  `require`s it works too (its `tsdown.config.mts` says how).
- **Testing**: vitest, React Testing Library. Every suite is `*.test.ts(x)`, and
  which of the two projects runs one is decided by its **path**: the root
  `vitest.config.mts` excludes `apps/strategy-practice`, `packages/strategy-engine`
  and `packages/strategy-games` — that app and the code it moved out — from its own
  project, and that app's config includes exactly those three. One `npm test` runs
  both projects through vitest, and neither uses Jest.
- **`apps/strategy-practice`** shares this React major, the root's eslint,
  typescript and vitest pins, and the same vite as the other frontends;
  Tailwind and its own build/test setup are what set it apart. See its
  `package.json` rather than assuming this one's.

## Development Commands

```bash
# Install dependencies, then create the gitignored .env files from their samples
npm ci
npm run setup

# On a checkout you already have, `npm ci` again only if a manifest moved.
# The dev:* and stack:* scripts do this and the seeding above for you, through
# scripts/prepare.mjs; these two names are for running either step on its own.
npm run deps

# The whole online round in docker: nginx + backend + postgres (detached)
npm run stack:build   # just the two deployed images, starting nothing — the CI gate
npm run stack:up      # builds the site, then brings the stack up on http://localhost
npm run teams:import  # loads scripts/test.tsv, once postgres is accepting connections
npm run stack:ps      # which services are up, when a URL shows nothing
npm run stack:logs    # follow all three containers; Ctrl-C stops watching, not the stack
npm run stack:down

# The same thing without docker (except the DB), everything reloading
npm run db:up              # postgres (terminal 1)
npm run dev:server         # Backend on :8000 (terminal 2)
npm run dev:online         # Frontend on :5173 (terminal 3)
npm run teams:import:local

# Run offline frontend (the /proba-verseny/ dry run)
npm run dev:offline

# Run the relay practice site (/valto/)
npm run dev:relay-practice

# Build all packages
npm run build

# Lint — also the formatter: `lint:fix` applies it, and the editor runs it on save.
# One eslint per workspace, via turbo; `lint:root` is the pass for files in none.
npm run lint
npm run lint:fix

# Typecheck (tsc --noEmit per workspace, via turbo)
npm run typecheck

# Unit tests
npm test

# Translation key check
npm run i18n:check

# Spell check
npm run spell-check
```

`npm ci`, `npm run lint`, `npm run build`, `npm run typecheck`, `npm test` and
`npm run spell-check` cover `apps/strategy-practice` too — *Project Structure*
above says how. To work on it alone:

```bash
npm run dev:strategy-practice            # from the root; it is a workspace
npm test --workspace=strategy-practice   # its suite alone
cd apps/strategy-practice && npm run coverage
```

Every long docker invocation lives in a root npm script rather than in prose,
so it is written down once. [`README.md`](README.md) is the authority on
running things locally: how to bring the stack up, and — under *Checking it
works* — the regression checklist, with how to exercise each item by hand.

## What must keep working

[`README.md`](README.md) § *Checking it works* is the standing regression
checklist: what the competition round, the admin side and the public sites
must keep doing, with how to exercise each item by hand. **A change is done only
when every item it reaches still holds** — that section opens with the table of
which items a change reaches, and one fitting none of its rows reaches all of
them. Before a competition the whole list is walked whatever the last change
was. An item is removed only when the capability is deliberately retired, with a
note saying which PR did and what replaced it. The README's own setup steps are
on the list too: `npm ci`, `npm run setup` and the `dev:*` and `stack:*`
commands must keep doing what it says they do.

It is a hand-walked checklist, not a suite. Seven items have a unit test pinning
part of them; the rest are checked by someone actually doing them:

- a join code loading its team, and a logout dropping the saved match with it:
  `packages/common-frontend/src/client/hooks/user-model.test.ts`
- the relay round against the bot — problems served, the three tries and what
  each is still worth: `packages/relay-bot/src/games/relay/strategy.test.ts`
- what a returning team may start, and the closing of a match whose time ran
  out while it was away: `apps/online-backend/src/server/team_manage.test.ts`
- the time left recomputed from the match's own end, and only the team allowed
  to poll for it: `packages/game/src/common/gamewrapper.test.ts`
- the admin API asking for the organisers' password on every route under
  `/team/admin` and `/game/admin`, whatever the path's case:
  `apps/online-backend/src/server/admin_session.test.ts`
- a saved match resuming with the bot to move, on the sites that run the bot in
  the browser: `packages/common-frontend/src/common/local-with-bots.test.ts`
- a strategy match played over a real socket — the player's move, the bot's
  answer, a reload resuming where it left off, and a match left on the judge's
  turn played on: `apps/online-backend/src/socketio_transport.test.ts`. The only
  suite that crosses the wire, and it is still no substitute for the round
  against `npm run stack:up`: it has no nginx and no built frontend in front of
  it.

## Creating a New Game

The steps below are for a game in the *live competition* (boardgame.io). For
a game on the *strategy practice* site, the `new-game` skill under `apps/strategy-practice` is
the route — there a game is one self-contained folder: gameplay, bot, curated
start boards, board client and specs together.

1. Create the game as one self-contained folder in
   `packages/game/src/games/strategy/<game-name>/` — `stones/` and `19ocd/`
   are the live examples:
   - `game.ts` - boardgame.io game definition
   - `strategy.ts` - the server bot, plus any lookup tables it imports
   - `board.tsx` - React component for the game board
   - `main.tsx` - the game description shown to players

   No `index.ts` barrel: the three files are registered separately, below,
   and a barrel re-exporting the bot next to the board would undo that.

2. Register it in the three registries under
   `packages/game/src/games/strategy/`, one per package entry:
   `strategy-games.ts` (the game definition and its name — the `game` entry),
   `strategy-bots.ts` (`game/bot`) and `strategy-client.ts` (`game/client`).
   `apps/online-backend/src/server.ts` imports `game` and `game/bot`; the
   live client `game` and `game/client`; the offline dry run all three.

**The live client must not ship the bot.** The bots are reachable only
through the `game/bot` entry, and only the server and the offline dry run may
import it: ESLint forbids the specifier everywhere else (`eslint.config.mjs`),
`packages/common-frontend` included, since the served bundle carries that
package too. `packages/game/src/entries.test.ts` walks the package's own
graph to pin that everything the bot entry shares with the two entries the live
client ships is a rules file — `src/common/` or a game's `game.ts` — so a table
under whatever name, reached from a board or pulled into the rules, fails the
tests instead of handing every competitor the tables. The offline dry-run build
imports `game/bot` on purpose (its bot runs in the browser, after the game
is public). Before a competition, still do the by-hand check in
`README.md` § *Checking it works*: build, then grep `apps/online-frontend/dist`
for a lookup-table key.

### Game Structure (boardgame.io)

```typescript
{
  setup: () => G,                    // Initial game state
  moves: {
    moveName: ({ G, ctx }) => void,  // Player actions
  },
  // Wrapper additions (see packages/game/src/common/types.ts):
  possibleMoves: (G, ctx, playerID) => PossibleMove[],
  startingPosition: ({ G, ctx, playerID, random }) => G,  // optional
  turn: {
    minMoves: 1,
    maxMoves: 1,
    endIf: ({ G, ctx }) => boolean,
  },
}
```

A move takes as many arguments as you give it — `moves.changeCoins(K, L)` for
a "pick two values, then commit" turn, driven by form inputs rather than by a
click on the board. The two live games are both single-click, single-argument;
nothing in the wrapper requires that.

The opening position has two homes, and `GameMixin.startingPosition` in
`packages/game/src/common/types.ts` says which to pick.

## Environment Files

`npm run setup` copies each from its committed `*.sample` twin, never
overwriting one that exists, and the dev container runs it for you. Six files:
`.env.docker` for the docker stack, `.env.local` for `common-frontend`'s build,
and an `.env` each for `online-backend`, `online-frontend`, `offline-frontend`
and `relay-practise-frontend`. It also names any setting a file lacks that its
sample has — key names only, never values. [`README.md`](README.md) §
*Configuration you may want to change* is the table of what reads which, and
says why values are left out of that comparison.

## Docker Deployment

```bash
# Build and run the production stack (no dev overlay)
npm run stack:prod
```

That is how `verseny.durerinfo.hu`, the real competition, is deployed — nginx +
docker compose, not GitHub Pages.

## GitHub Pages Deployment

One site, one artifact, built by `.github/workflows/pages-deploy.yml` on every
push to `main`: a home page plus `/jatekok/` (strategy practice), `/valto/`
(relay practice) and `/proba-verseny/` (the offline dry run). The whole prefix
comes from one `SITE_ROOT` constant in `scripts/assemble-site.mjs`, which both
the workflow and `npm run site:build` call — so `npm run site:serve` previews
the deploy's own code, not a copy of it.

**A push to `main` deploys the public site.** There is no staging step and no
separate approval — the workflow going green is the cutover.

The testers' dry run is the other Pages deploy and not part of that artifact:
`.github/workflows/dry-run-deploy.yml` publishes `apps/offline-frontend` to the
year's *private* repo's Pages, on demand only, and runs the same
`scripts/deploy-dry-run.mjs` that `npm run deploy` does. Its base path is the
repository's own name rather than a value anyone edits. The two workflows are
guarded in opposite directions — `pages-deploy.yml` to the public repo, this one
away from it — and `scripts/workflow-safety.test.mjs` pins both.

## Competition Secrecy

A new competition's game must stay secret until after the competition, so each
year has a private synced repo and the game is developed and deployed from
there. **Nothing about an unreleased game may appear in a public commit** —
including engine changes phrased around its needs.
[`README.md`](README.md), under *Competition secrecy*, is the authority: how the
mirror works, and what to set up when the year's repo is created.

## Key Conventions

[`CONTRIBUTING.md`](CONTRIBUTING.md) is the human-facing front door to this
section: it routes to the docs below rather than restating them, and carries the
few rules — commit subjects, the test-file naming split, requesting a reviewer —
that were previously written down only here or nowhere.

- Games are organized by type: `strategy/` (two-player), `relay/` (team relay)
- Each game's folder holds its game wrapper, bot and board as separate files,
  registered in the three registries next to the folders — never through a
  folder barrel, so the `game`, `game/bot` and `game/client` entries stay apart
- Use Hungarian for user-facing text (competition is in Hungarian). The
  strategy practice site is the exception: it has an HU/EN switcher (and a
  `?lang=` param), so its strings are translated. The relay practice site is
  pinned to Hungarian — `LANGUAGE` in `apps/relay-practise-frontend/src/App.tsx`
- Winner is tracked in `G.winner` state field
- **Formatting is ESLint's, through `@stylistic`, not prettier's.** The
  character-level rules — spacing, blank lines, final newlines — live in
  `eslint.stylistic.mjs`, which both configs import; the rules that decide where a
  line *breaks* stay per-workspace (`layout` in
  `apps/strategy-practice/eslint.config.js` says why). A rule joins the shared set
  only if it fixes characters, never line breaks: layout here often carries meaning
  — a board written as a grid, assertions aligned to be read side by side — and
  `--fix` must not rewrite it. `@stylistic/indent` is absent for that reason, and
  `.editorconfig` settles indentation for new code instead. Quote style is enforced
  only where the code already agrees on one — `apps/strategy-practice` and the two
  packages moved out of it — because the rest of the repo never settled, and
  picking for it is a decision of its own rather than a side effect of a formatting
  change. Prettier was evaluated and rejected: it re-prints each file from its AST,
  and rewrote 661 files where these rules rewrite 112 — the difference being
  prettier's opinion, not this repo's inconsistency. Generated lookup tables have
  the formatting rules switched off by name (`stylisticRulesOff`), which keeps
  every rule about meaning applying to them.
- Comment what is not evident from the code — a rule the condition alone does
  not imply, a non-obvious invariant, why an apparently redundant branch
  exists. A comment restating the line below it is noise.
- Say a thing once: rationale lives in the doc that owns the decision, and
  comments point at it rather than restating it.
- Cover major new functionality with unit tests. For a new game that means the
  game logic first: move validators and the strategy — the pure functions where
  a wrong branch decides a competition. Trivial wiring (exports, registration,
  pass-through props) needs no tests, and exhausting every branch is not the
  goal: test the rules and the edge cases that could plausibly be gotten wrong.
- Every regression fixed gets a unit test that fails without the fix.
  The README's checklist (*What must keep working* above) catches
  whole-feature breakage by hand; the test pins the specific bug so it cannot
  quietly return.
- A test run writes its report and nothing else: a console call during it fails
  the test that made it, and a test that exercises a logging path on purpose
  stubs the method and asserts on the spy. `vitest.setup.mts` says why and how.
- PRs are split by **atomicity, not size** — one independent change each, so a
  reviewer can accept or reject them separately.
- An agent opening a PR assigns the person it is working for, so it lands in
  their queue rather than going unnoticed.
- Permission to commit to someone else's branch is not permission to comment on
  their PR. An agent asks first before posting to a thread it does not own — the
  commit messages already carry the reasoning, and the thread is the author's.
- Keep PR descriptions and review comments short. Say what changed and why, and
  stop; the diff, the commit messages and the linked docs carry the rest. Length
  is not thoroughness — it costs the reviewer the time the change was meant to
  save.
- Do not `@`-mention anyone not already involved in the thread: a mention is a
  notification. Naming a person plainly, or referring to their PR by number,
  says the same thing without pulling them in.
