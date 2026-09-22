# Durer Online Round Framework

Real-time multiplayer framework for online math competitions with interactive
games, built on boardgame.io.

[`README.md`](README.md) is the authority on running things, operations,
dependencies and deployment; [`CONTRIBUTING.md`](CONTRIBUTING.md) is
the human front door and carries the commit and pull request rules. This file is
the map and the rules an agent must not get wrong.

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
pages/                # static content the Pages deploy serves but no app builds
```

**"Practice" alone is ambiguous — say which one.** The *strategy practice* site
(`apps/strategy-practice`, `/jatekok/`), the *relay practice* site
(`apps/relay-practise-frontend`, `/valto/`) and the offline *dry run*
(`apps/offline-frontend`, `/proba-verseny/`) are three different apps. The first
two are the practice sites; the dry run is a rehearsal of the competition round.

**`apps/strategy-practice` is a workspace, but not like the others**: it keeps
its own ESLint and vitest configs, which turbo and the root `vitest.config.mts`
run alongside everything else. Its own
[`AGENTS.md`](apps/strategy-practice/AGENTS.md) — which loads automatically when
you work under that directory, since memory files nest by directory and settings
do not — is the authority on everything inside it, § *How this app sits in the
monorepo* included.

**Do not run `npm ci` from a workspace directory.** There is one lockfile, at the
root. From a workspace npm installs that subtree, leaves the root's own
dependencies unmet — which the other apps then fail to build against — and exits
0 while doing it.

**Never run `npm audit fix --force`**: its fix for boardgame.io's advisories is a
four-year downgrade of it. Don't build toward replacing boardgame.io either (#277).

## Tech Stack

- **Frontend**: React 19, Vite, MUI (Material-UI), React Router
- **Backend**: boardgame.io server, Koa, PostgreSQL (via bgio-postgres)
- **Build**: Turborepo, TypeScript, tsdown. The packages ship ESM only
  (`packages/strategy-engine` builds both formats), and the backend is one
  tsdown bundle built from the packages' *source*, so nothing of its waits on a
  package build. Each `tsdown.config.mts` says why
- **Testing**: vitest, React Testing Library — no Jest. Every suite is
  `*.test.ts(x)` beside what it tests, and which of the two vitest projects runs
  one follows from its **path**: the root project excludes
  `apps/strategy-practice` and `packages/strategy-engine`; that app's config
  includes exactly those two, and adds Tailwind and its own build setup

## Development Commands

[`README.md`](README.md) is the authority — *Getting Started* for the stack in
four commands and the reloading setup without docker, *The checks CI runs* for
the seven gates. `npm run check` is the six that need no docker, cheapest first,
and is what to run before pushing. All of it covers `apps/strategy-practice`
too; `npm test --workspace=strategy-practice` is that app's suite alone. Every
long docker invocation lives in a root npm script rather than in prose, so it is
written down once.

## Creating a New Game

For a game on the *strategy practice* site, the `new-game` skill under
`apps/strategy-practice` is the route. For the *live competition*
(boardgame.io), [`README.md`](README.md) § *Creating a new game* is the recipe:
one self-contained folder under `packages/game/src/games/strategy/<game-name>/`
holding `game.ts`, `strategy.ts`, `board.tsx` and `main.tsx`, registered in the
three registries beside it — one per package entry. Two rules there decide
whether the change is safe, and both fail late if you get them wrong:

- **No `index.ts` barrel, and nothing shared between the bot and the board
  outside `game.ts`.** A helper beside them is a file the `game/bot` entry and
  the client entry have in common, which `packages/game/src/entries.test.ts`
  reads as the bot reaching the served bundle
- **The live client must not ship the bot.** ESLint forbids the `game/bot`
  specifier everywhere but the server and the offline dry run — the dry run
  imports it on purpose, since its bot runs in the browser after the game is
  public. Before a competition, still check by hand: `npm run build`, then grep
  `apps/online-frontend/dist` for a lookup-table key

**The rules and the bot are typechecked twice**, because the server reads the
game package's source under its own `lib` and without the DOM. A `document` in
`game.ts` or `strategy.ts` passes `packages/game`'s own typecheck and fails the
server's, naming the game package; a board may use whatever the browser gives it.

## Environment, deployment, secrecy

`npm run setup` seeds the six gitignored `.env` files from their committed
samples; [`README.md`](README.md) § *Configuration you may want to change* is the
table of what reads which. The real competition, `verseny.durerinfo.hu`, runs on
nginx + docker compose (`npm run stack:prod`), not GitHub Pages —
[`DEPLOYMENT.md`](DEPLOYMENT.md) is the walkthrough.

**A push to `main` deploys the public site** — `/jatekok/`, `/valto/` and
`/proba-verseny/` in one artifact, with no staging step and no approval; the
workflow going green is the cutover. The testers' dry run is the *other* Pages
deploy, published on demand to the year's *private* repo; the two workflows are
guarded in opposite directions and `scripts/workflow-safety.test.mjs` pins both.

**Nothing about an unreleased game may appear in a public commit** — including
engine changes phrased around its needs. A new competition's game is developed
and deployed from the year's private synced repo until the competition is over;
[`README.md`](README.md) § *Competition secrecy* is the authority.

## Key Conventions

[`CONTRIBUTING.md`](CONTRIBUTING.md) carries the rules about working: commit
subjects, where a test goes and what it must not print, pull request scope and
reviewers, and the traps that cost the most time. Read it rather than repeating
its contents here. What follows is the rest.

- Games are organized by type: `strategy/` (two-player), `relay/` (team relay),
  and the winner is tracked in `G.winner`
- Use Hungarian for user-facing text (the competition is in Hungarian). The
  strategy practice site is the exception: it has an HU/EN switcher (and a
  `?lang=` param). The relay practice site is pinned to Hungarian — `LANGUAGE` in
  `apps/relay-practise-frontend/src/App.tsx`
- **Formatting is ESLint's, through `@stylistic`, not prettier's.**
  `eslint.stylistic.mjs`, which both configs import, holds the character-level
  rules and says why a rule joins that set only if it fixes characters, never
  line breaks: layout here often carries meaning, and `--fix` must not rewrite
  it. Generated lookup tables have those rules switched off by name
  (`stylisticRulesOff`), which keeps every rule about meaning applying to them
- Comment what is not evident from the code — a rule the condition alone does not
  imply, a non-obvious invariant, why an apparently redundant branch exists. A
  comment restating the line below it is noise
- **A comment describes the code as it stands.** What it did before, and which
  change moved it, belong to the commit and the PR — no "previously", no "this
  PR removes". Where the past is the point, state it in the present, as a
  standing hazard. Suites are the exception: a regression test names its bug
- Say a thing once: rationale lives in the doc that owns the decision, and
  comments point at it rather than restating it
- Cover major new functionality with unit tests — for a new game, the game logic
  first: move validators and the strategy, the pure functions where a wrong
  branch decides a competition. Trivial wiring (exports, registration,
  pass-through props) needs none, and exhausting every branch is not the goal
- Keep PR descriptions and review comments short. Say what changed and why, and
  stop; the diff, the commit messages and the linked docs carry the rest
- A PR body carries one Claude Code footer, and it is not the agent's to write —
  the integration appends one to every body it opens. A *comment* is the other
  way round: the duplicate is stripped there, so write it
- An agent opening a PR assigns the person it is working for, and names its
  session for what the work is about, not for the ticket alone — `#461 duplicate
  socket.io copy in the lockfile`, not `Issue 461 investigation`
- Permission to commit to someone else's branch is not permission to comment on
  their PR: ask first before posting to a thread you do not own
- Do not `@`-mention anyone not already involved in a thread: a mention is a
  notification. Naming a person plainly, or referring to their PR by number, says
  the same thing without pulling them in
