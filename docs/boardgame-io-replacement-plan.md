# Replacing boardgame.io with the durer-jatekok engine — migration plan

> **Disclaimer**: this is a preliminary draft written by AI (Claude), based on
> exploration of both repos and maintainer answers to the key decision
> questions. Treat it as a **living document** — expect it to be corrected and
> reshaped as phases are executed and reviewed, not followed to the letter.

Status: **draft** — execution happens phase by phase in this repo, and each
phase should update this doc with what was actually done and learned. This doc
is the coordination artifact (as durer-jatekok's
`docs/real-competitions-plan.md`, durer-jatekok#318, was for the decision it
led to).

## Context

This repo runs the live
(online) round of real Dürer competitions on **boardgame.io 0.50.2** —
effectively unmaintained, already forked-by-copy in
`apps/online-backend/src/socketio_botmoves.ts` (223 lines of copied boardgame.io
server internals) to make server-side bot moves work, with an `.npmrc
legacy-peer-deps` that exists solely for a boardgame.io/bgio-postgres conflict.
durer-jatekok's `strategyGameFactory` engine was deliberately built to take over
that slot (its AGENTS.md § Planned future directions; epic durer-jatekok#269 with groundwork
durer-jatekok#312/durer-jatekok#313/durer-jatekok#314 done). The goal: replace boardgame.io with a derivative of that
engine, keep everything working throughout, and merge the two repos so the
practice site is served from the same repo.

## Decisions taken

1. **Merge repos early** — durer-jatekok moves into this turborepo as its
   own workspace (history preserved via `git subtree`); all engine work then
   happens once, in one repo, eliminating the parallel-changes risk of a
   package or vendored copy.
2. **Relay round**: migrate the strategy round first (relay stays on
   boardgame.io as the working fallback), then rebuild relay as **plain REST**
   reusing the already-pure problem bank and grading; boardgame.io is removed
   only after both rounds are off it.
3. **Transport: plain HTTP** — a move is a POST whose response carries the
   authoritative new state including the bot's reply computed synchronously
   server-side; the countdown polls (which also picks up admin time
   extensions). No websockets.
4. **offline-frontend is kept and ported** to the new engine (in-browser bot,
   localStorage persistence, competition chrome).

## Competition secrecy: the yearly private-repo flow

A hard requirement the architecture must keep serving: **a new competition's
game must stay secret until after the competition**, when it becomes a public
practice game. Today this works through a per-year **synced private repo**:
`sync.yml` in the public repo mirrors any pushed `sync-*` branch into the
year's private repo (`PRIVATE_REPO_NAME`/`PRIVATE_PAT` secrets, merging with
`-X ours` so public content wins — PR #180 made syncing intentional).
Framework development happens in the public repo; the actual competition game
is developed and deployed **from the private repo**; after the competition a
merge-back PR publishes it (PR #177 / issue #178, the 19th competition).

The migration preserves and improves this flow:

- **`sync.yml` is branch-level and repo-shape-agnostic** — the subtree merge
  and workspace changes don't break it. It stays green on the
  must-keep-working checklist throughout.
- **The new architecture makes the secret smaller and the merge-back
  trivial.** A competition game becomes one self-contained folder under
  `packages/games` (gameplay, bot, curated start boards, BoardClient, specs)
  plus a registration line. The private repo's delta over public shrinks to
  exactly that folder; the post-competition PR (the #177 of the year) drops it
  into the public monorepo and registers it on the practice site **in the
  form the practice site already uses** — no porting step, which is the
  secondary goal's payoff.
- **Everything secret is in that folder**: rules, curated start boards and
  the optimal bot are all pre-competition secrets (the server-only bot at
  runtime protects only against bundle-sniffing, not against reading the
  public repo). Nothing about the new game may leak into public commits —
  including engine changes phrased around the new game's needs; those land
  generically or wait.
- **Private play-testing gets better**: once practice is in the monorepo, the
  private repo can register the secret game on its own practice-site build
  and play-test it internally before the competition.

**Timing constraint this adds**: the heavy repo-shape phases (0–1, and the
Phase 3/4 backend/frontend swaps) should not run while a year's private repo
is active with an unmerged game — `-X ours` public-wins syncs into a
diverged private repo make the game team rebase over refactors repeatedly.
Sequence each year's private-repo cut *after* the disruptive phases of the
moment, and sync (`sync-*` push) right before cutting it.

**Board UI decision**: both live competition games (`19ocd` =
`remove-divisor-multiple`, `stones` = `stones-remove-one-not-twice-from-left`)
reuse durer-jatekok's implementations — gameplay, bot **and** `BoardClient` —
rather than adapting durer-aion's boards. Those `board.tsx` files are thin
bgio-coupled SVG with game logic inlined in JSX, hardcoded Hungarian and no
disabled-state gating; adapting them is a rewrite anyway, and the gameplay/bot
halves must come from here regardless. Accepted cost: the competition
frontends gain a Tailwind build step and the small `language` provider.

## What the engine still owes the migration

The React-free core (`engine/`, `types.ts`, `resolve-variants.ts`; lodash-only)
is most of the value, but four gaps block server use today:

- `import.meta.env.DEV` in `engine/reducer.ts` and
  `games/shared/unexpected-state.ts` breaks bare Node (vitest shims it).
- No React-free registry: `Game.gameplay`/`Game.variants` hang off the React
  component, and variant wiring lives in each `<game>.tsx`.
- No authoritative-move API: nothing shaped like
  `applyClientMove(state, gameplay, name, args)`, and the bot-turn loop is
  embedded in `run-match.ts`.
- No JSON-serialization contract for `board`/`turnState`.

## What durer-aion keeps (engine-agnostic, ports as-is)

`packages/schemas`; team identity/auth (TSV import, join codes, per-team
credentials, admin basic-auth); the team REST API and Teams/DeletedTeams
tables; match-lifecycle policy (`allowedToStart`, `checkStaleMatch`, …);
almost all of `common-frontend` (login, chooser, admin, `Countdown` — which
already re-syncs by polling); the relay problem bank and grading (pure);
deployment infra; `scripts/admin.py`.

What boardgame.io provides there and the replacement must cover: authoritative
server reducer + validation, client state sync (reload/disconnect recovery),
match persistence with optimistic concurrency + an append-only log, per-player
credentials on every move, phase/turn orchestration, the server-side bot loop,
admin "add minutes" push, an offline mode, and a headless test client.
Consciously dropped: secret state/playerView (unused), plugins, stages, the
lobby REST flow (already bypassed), undo/redo (server-side), websockets.

## What must keep working (the standing checklist)

Every phase's verification points back to this list; a phase is done only when
each item still holds. It lives as [`docs/must-keep-working.md`](./must-keep-working.md)
and is updated only when a capability is deliberately retired by a later phase
(noted inline). The summary below is kept as the plan's rationale for it; the
checklist file is the one to walk.

**Practice site (durer-jatekok, then `apps/practice`)**
- `jatek.durerinfo.hu` serves the site; deploy-on-main works; every game
  playable in both modes; existing CI gates (lint, typecheck, unit tests,
  patch coverage) stay green.

**Online competition round**
- Team login by join code; disclaimer → chooser flow; a team can start,
  play, and finish a strategy match against the server bot (test and live),
  with role choice, streak scoring and the 30-minute countdown.
- Relay: start, receive problems, submit answers with 3 tries and decreasing
  points, 60-minute clock.
- Reload/disconnect mid-match resumes without loss; a second tab cannot
  corrupt a match; the clock cannot be gamed client-side.
- Final score = relay + strategy shows on the finished screen.

**Admin / operations**
- TSV team import (HTTP and CLI script); admin team list, per-team detail,
  per-match state and log dumps, add-minutes on running matches, relay/strategy
  reset, soft team delete, per-category stats.
- `scripts/admin.py` pulls all teams and match data for post-competition
  scoring (payload shape changes at Phase 3 — admin.py is updated with it).
- Deployment runbook works: `docker compose up` from `DEPLOYMENT.md` yields a
  serving stack; team import runs in the container; Sentry receives events.

**Offline practice build**
- The gh-pages build serves the competition games with in-browser bot and
  localStorage persistence surviving reload.

**Competition secrecy flow**
- Pushing a `sync-*` branch mirrors it into the year's private repo
  (`sync.yml`); a competition game can be developed and deployed from the
  private repo with zero trace in public; the post-competition merge-back PR
  publishes it as a practice game.

## Target architecture (end state)

```
durer-aion/ (root renamed from bgio-tutorial)
  apps/
    practice/          # this site, subtree-merged; Pages deploy → jatek.durerinfo.hu unchanged
    online-backend/    # plain Koa + Sequelize; no bgio
    online-frontend/   # SPA; new strategy/relay shells; no socket.io
    offline-frontend/  # same shells + in-browser bot + localStorage
  packages/
    engine/            # React-free core ("." export, ESLint-enforced) + "engine/react" subpath
                       #   (game-board, hooks, language provider); tsup build like packages/schemas
    games/             # competition games as full folders exporting factory-agnostic config objects
    competition/       # React-free match state machine: attempts, role choice, test/live, clock,
                       #   streak ladder, start-board-per-attempt, event types
    schemas/           # + engine discriminator ('bgio' | 'v2') + client-view DTOs
    strategy/          # shrinks to relay problem bank + pure grading
    common-frontend/   # + strategy-shell/ + relay REST wiring
```

Dependency direction: `apps → competition → games → engine`; `engine` depends
only on lodash. The React-free import-graph spec moves with the code and keeps
enforcing the boundary. The client view is built with the `buildCtx`
allow-list — server bookkeeping never ships, the principle the engine already
encodes.

## Phased PR plan

Sizing: S ≈ <150 review lines, M ≈ <500, L = large but isolated or mechanical.
**Every PR leaves both sites shippable**; each phase boundary is a safe stop.

**Bookkeeping convention**: items below carry a checkbox and, once a PR exists
for them, its number. **The PR that does the work ticks its own box, in the
same PR** — so this section is a record of what has shipped, not of what was
once intended. A planned item that turns out to need several PRs is split here
into the PRs that actually landed it, rather than being ticked as a whole.

### Phase 0 — Baseline + repo merge

The migration starts by making durer-aion safe to change: today its CI runs
lint at `--max-warnings=107` through a third-party action, the test job is
commented out even though four jest test files and per-package `test` scripts
exist, there is no typecheck gate, jobs pin different Node versions (24 vs 22)
on outdated action versions, and no `.nvmrc`/`engines` pins the toolchain.
Every later PR is reviewed against this net, so it comes first.

**Developer-experience principle for all of Phase 0**: existing durer-aion
developer workflows are broken only where unavoidable — everything else is
additive. `npm ci` at the root, `npm run dev:server` / `dev:online` /
`dev:offline`, the docker-compose dev flow and the README setup steps keep
working unchanged throughout the phase; new tooling (devcontainer, turbo
tasks, pinned Node) arrives alongside the existing setup, not instead of it.

- [x] **PR 0.0 (M)** durer-aion baseline. Planned as one PR; split during
  execution into six, because the pieces share a phase and nothing else, and
  each is independently reviewable and revertible:

  - [x] **The regression checklist** — `docs/must-keep-working.md`, what every
        phase's verification points back to, so it exists before the first PR
        that changes anything. **#228**

  - [x] **Toolchain pin + CI on plain npm scripts** — `.nvmrc` + root
        `engines` (Node 24, matching the Dockerfile; a warning, not
        `engine-strict`, so a developer on another minor is nudged rather than
        blocked), every job reading `node-version-file` on current
        `actions/checkout`/`setup-node` with npm caching, and the
        `wearerequired/lint-action` wrapper replaced by `npm run lint`.
        `--max-warnings=107` moves into the root `lint` script so the same
        gate runs locally and in CI (106 warnings today). CI also triggers on
        PRs targeting any branch, so stacked PRs get the gates too. **#229**

  - [x] **vitest + a working test job** — the existing test setup was not
        merely disabled, **no runner was installed**: `jest` was not a
        dependency anywhere (only `@types/jest` and a leftover config block),
        the per-package `test` scripts failed with `jest: not found`, and the
        commented-out CI job was a CRA-era fossil pinned to Node 16. vitest
        (ESM/TS-native, and what the practice repo uses, so the merged repo
        converges on one test stack), with the three real suites ported —
        `gamewrapper.test.ts` (the harness Phase 2's golden parity tests build
        on), `team_import.test.ts`, `Main.test.tsx` (jsdom) — and the
        placeholder `App.test.tsx` deleted. 21 tests green. **#232**

  - [x] **Typecheck gate** — `tsc --noEmit` per workspace via turbo, gated in
        CI. **#233**

  - [x] **Dockerfile `CMD` runs the built server** instead of tsx watch mode;
        the docker-compose dev flow keeps its auto-reload through a
        `docker-compose.dev.yml` overlay, which makes `docker-compose.yml`
        the production stack. **#231**

  - [x] **Optional `.devcontainer/`** (modeled on durer-jatekok's), offered
        rather than replacing the documented local setup; developers who
        ignore it lose nothing. **#234**

- [x] **PR 0.1 (S)** durer-aion hygiene: delete the dead root `src/`, rename the
  root package `bgio-tutorial` → `durer-aion`, `private: true`.
- [ ] **PR 0.2 (M)** merge durer-jatekok in as `apps/practice`. Split during
  execution into three, because the deploy switch carries all of the risk and
  should not ride inside a 570-file diff:

  - [x] **Import the code** — practice stays **outside** npm workspaces (own
        lockfile, own `npm ci`), and the root's lint/test/typecheck/build/
        spell-check are pointed away from it. Its workflows come along under
        `apps/practice/.github/`, where GitHub does not read them, so
        durer-jatekok keeps deploying the site until the next PR.

        Done with `git filter-repo --to-subdirectory-filter` + a merge rather
        than `git subtree add`: after a plain subtree add, `git log` and
        `git blame` on a practice file stop at the import commit, which
        defeats the point of preserving the history. Rewriting the paths first
        makes both traverse all 1029 commits. **The PR must be merged with a
        merge commit — a squash would flatten that history back to one.**

        **Learned the hard way — rewrite the commit *messages* too.** The
        imported commits carry 78 closing keywords (`fixes #64`,
        `Resolves #144`, …), each meaning a durer-jatekok issue. GitHub
        applies closing keywords in commits pushed to the default branch to
        the *receiving* repo, so merging this closed 14 unrelated durer-aion
        issues and one open PR, all within nine seconds. The same filter-repo
        pass can prevent it with a `--message-callback` rewriting `#N` to
        `durer-jatekok#N`, which also keeps the references meaningful. Do that
        before any future repo import; afterwards the only remedy is reopening
        by hand.
  - [ ] **Move the deploy here** — port the three workflows to the root with
        `paths` filters, and consolidate GitHub Pages onto one site serving
        one artifact, since a repo has exactly one Pages site and durer-aion's
        `gh-pages` branch deploy already claims it. Planned in detail in
        [`docs/pages-consolidation.md`](./pages-consolidation.md): it needs a
        new domain, a redirect GitHub does not provide for us, and changes to
        durerinfo.hu, so it is sequenced across this repo and two people
        outside it. Split again during execution, deploy last:

    - [x] **Play data upload made optional** — `sendData` no-ops instead of
          throwing when no S3 bucket is configured, so `/proba-verseny/` can
          deploy without one.
    - [x] **The two non-deploy workflows ported** — `pr-test` and
          `dependency-report` moved to the root with `paths` filters. Leaving
          the directory they resolved paths from broke three scripts, all of
          them silently; see the pages doc.
    - [x] **A parameterised base path** — both vite apps read `SITE_BASE`, so
          the deploy composes all three subpaths from one variable.
    - [x] **The 2023 relay build preserved** — committed at `pages/valto-2023/`
          with a script that rebases it onto whatever prefix serves it, so
          switching the Pages source does not take relay practice offline.
    - [x] **The deploy itself** — `test-and-deploy` replaced by
          `pages-deploy.yml`, which builds each app against its own subpath,
          rebases the frozen relay artifact and uploads one artifact. **Live**:
          all four pages serve from `github.io/durer-aion/`, and relay practice
          moved from that root to `/valto/` without an outage, which is what the
          committed 2023 artifact was for.

          Two things the first run taught, both in the pages doc: the build job
          runs under `sh`, not bash, so `set -o pipefail` fails the step; and a
          Pages deployment from Actions goes live even while Settings still says
          "Deploy from a branch" — the workflow going green *is* the cutover,
          with the setting reconciled afterwards.
  - [x] **Merge the tooling** — the two `.claude/` setups, the SessionStart
        hook, and `claude.md` → `CLAUDE.md` rewritten for the monorepo.

        Two corrections to what was planned below. **`claude.md` was never
        being read at all**: Claude Code looks for `CLAUDE.md`, and on a
        case-sensitive filesystem the lowercase name simply does not match — so
        the root memory file has been inert since it was written, which is part
        of why it still described Jest. **And subdirectory *commands* are not
        surfaced, only subdirectory skills are** — `new-game` was invisible
        under `apps/practice/.claude/commands/` and appeared immediately when
        moved to `.claude/skills/new-game/`. It is a skill now.

        The hook installs one project per lockfile rather than a fixed list, so
        PR 0.3 removing practice's lockfile narrows it to the root with no edit.

  durer-jatekok gets a README banner; archival waits until Phase 7.

  Migrate the collaboration state, not just the code:
  - **Open PRs cannot be transferred and their branches are not part of the
    subtree snapshot — drain them first.** Land or close durer-jatekok's open
    PRs before the subtree add (3 at the time of writing); one that must
    survive the cutover is re-created here with its diff replayed under the
    new prefix (`git apply --directory=apps/practice`). From the subtree add
    on, durer-jatekok accepts no new PRs.
  - **Transfer the open issues** (2 at the time of writing) to this repo with
    GitHub's issue transfer — same-org transfers preserve content, comments
    and subscribers, and old URLs redirect, so existing `durer-jatekok#NNN`
    references keep resolving. Recreate the needed labels here first
    (`new game`, `framework`, …), since transfer drops labels that don't
    exist in the target.
  - **Transfer or link relevant Discussions** (durer-jatekok has them
    enabled): enable Discussions here, transfer the ones still worth
    having, and let the rest ride on the archived repo, where they stay
    readable.
  - From merge day the banner directs new issues and discussions here; the
    durer-jatekok tracker stays empty rather than frozen mid-conversation,
    which is what makes the Phase 7 archival a non-event.

  Merge the two `.claude/` setups — after the merge only the root
  `.claude/settings.json` loads for sessions opened at the monorepo root, so
  `apps/practice/.claude/settings.json` goes inert rather than conflicting:
  - Union the permissions into the root file: keep durer-aion's `gh`
    allows/denies + `WebSearch`; re-add practice's npm-script allowlist in the
    shapes the monorepo actually uses (root `turbo run …` /
    `npm run -w apps/practice …` — permission rules match literal command
    strings, so the entries follow whatever PR 0.3 wires into `turbo.json`).
  - Move practice's `SessionStart` hook to the root `.claude/hooks/`: its
    three jobs (web-session git attribution, nvm Node pinning off `.nvmrc`,
    `npm ci` when the tree is unsound) are all monorepo-root concerns — PR 0.0
    provides the root `.nvmrc` it reads; until PR 0.3 unifies the lockfiles it
    installs in both root and `apps/practice`.
  - Commands/skills stay put: `new-game` and `play-game-in-browser` are
    practice-specific and remain under `apps/practice/.claude/` (surfaced
    directory-scoped); `draft-issue` stays at root.
  - Rename durer-aion's lowercase `claude.md` to `CLAUDE.md` and rewrite it
    for the monorepo; `apps/practice/CLAUDE.md` keeps loading automatically
    when working under it, since memory files nest by directory — settings do
    not.
  - Devcontainers nest like settings, not like memory files: VS Code only
    auto-detects them at the opened folder root, so durer-jatekok's
    `.devcontainer` (landing at `apps/practice/.devcontainer`) keeps working
    when opening that folder directly, and root-level named configs
    (`.devcontainer/practice/`, `.devcontainer/aion/` from PR 0.0) surface
    both for whoever opens the monorepo root.
- [x] **PR 0.3a (M)** **One React major across the monorepo** — a prerequisite
  that was not in the original plan. It was found by attempting PR 0.3 below and
  measuring what broke; that attempt was reverted rather than landed.

  **Done, in two PRs.** The blocker turned out to be a single dependency:
  Recoil, used for exactly one atom, reaching into React's
  `__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED`, which React 19 removed.
  It was replaced with a ~20-line `useSyncExternalStore` store first, on React
  18, so that change stands on its own; the version bump then needed **one line**
  of source change (`React.ReactNodeArray`, gone from React 19's types).

  Everything else survived unchanged, which was the open question: boardgame.io
  0.50.2's React client mounts and its reducer runs, verified by playing through
  login → disclaimer → relay and → strategy in Chromium on both majors and
  getting **identical** output, down to the reducer's rejection of an illegal
  move. MUI 5.16, notistack 2, `react-text-mask` and Sentry 7 all work at
  runtime despite peer ranges that stop at 18 — those ranges are advisory here,
  and `legacy-peer-deps` was already on for boardgame.io's sake. Bumping them is
  worth doing on its own schedule, not as part of this.

  **npm nests the conflicting *direct* dependencies, but it hoists everything
  else** — and a hoisted package binds to whatever React sits at the root. That
  is React 18, while practice is on 19. Which packages land wrong is decided by
  their own peer range, not by anything we control:

  | peer range | what npm does | binds |
  | --- | --- | --- |
  | `^19.2.8` (`react-dom`), `>=19.2.7` (`react-router`) | must nest — root's 18 does not satisfy it | 19 ✔ |
  | `^18 \|\| ^19` (`@headlessui/react`, `@testing-library/react`) | may hoist — one copy satisfies both | 18 ✘ |

  So the packages that *support both majors* are exactly the ones that break,
  and the set shifts silently as dependencies are bumped. Measured on the
  attempt: **157 of practice's 1972 tests failed**, every one of them
  `Cannot read properties of null (reading 'useRef'/'useState')` — the signature
  of two Reacts in one render.

  Two things narrow it but do not solve it, both verified:
  - `resolve.dedupe: ['react', 'react-dom']` in practice's vite config **fixes
    the build** — `react-vendor` goes back to 290.88 kB from the 426.42 kB that
    two bundled Reacts produced. Worth keeping when 0.3 is retried.
  - It does **not** fix the test run: vitest externalises `node_modules`, so
    resolution happens in Node, past vite. `test.server.deps.inline: true` — the
    documented lever, inlining everything — changed nothing; manually nesting
    `@testing-library/react` by hand cut the failures to 86, which is what
    identified hoisting as the mechanism rather than any one package.

  npm has no per-workspace `nohoist`, so there is no configuration answer. The
  way through is to put the monorepo on one React major. `@mui/material@5.16`
  already declares `^17 || ^18 || ^19`, so the upgrade may be smaller than it
  looks — but it touches the live competition frontend and needs its own
  verification, which is exactly why it is not a line inside PR 0.3.

- [ ] **PR 0.3 (M)** Join npm workspaces: add to `workspaces`, drop the practice
  lockfile, regenerate the root lockfile. **Blocked on 0.3a** — attempted and
  reverted, see above. Verify both dev servers, builds and test suites —
  nothing else in this PR. Wire practice `test`/`lint`/`build`
  into `turbo.json`. Existing commands are untouched: the one visible change
  for durer-aion developers is that the root `npm ci` now also installs
  practice's dependencies (slower, not different); practice developers switch
  from repo-root commands to `apps/practice`-rooted ones — the one workflow
  break the merge genuinely forces, called out in the practice README and
  CLAUDE.md in the same PR.

  Two smaller things the attempt also surfaced, both to handle when it is
  retried:
  - **`apps/practice/.npmrc` stops being read.** npm reads only the `.npmrc` of
    the directory it runs in, so installing from the root ignores practice's
    `save-exact=true` and applies the root's `legacy-peer-deps=true` to it
    instead — a pinning convention silently dropped and a peer-check silently
    disabled. Both settings need a deliberate home before the merge.
  - **Node engines diverge**: practice requires `>=24.11.1 <25`, the root `>=24`.
    Harmless as a warning today, but `npm ci` from the root emits `EBADENGINE`
    for practice on any Node 24 below 24.11.1.

### Phase 1 — Engine hardening + extraction (practice behavior unchanged)

- [ ] **PR 1.1 (S)** `isDevMode()` shim (reads `import.meta.env?.DEV` when defined,
  else `process.env.NODE_ENV`) replacing the two `import.meta.env.DEV` uses —
  done in place so the move-PR stays a pure move.
- [ ] **PR 1.2 (L, mechanical)** `packages/engine`: move the engine core +
  `types.ts` + `resolve-variants.ts` (export `"."`, React-free) and
  `game-parts/game-board.tsx`, the hooks, the `language` provider (export
  `"./react"`); tsup build following `packages/schemas`. Practice's
  `strategy-game-factory`/`language` aliases become thin re-export barrels —
  **zero changes in the 85 game files**. Engine specs move along, including the
  import-graph spec.
- [ ] **PR 1.3 (M)** Server-facing API:
  `applyClientMove(state, gameplay, name, args)` (validate → reduce → auto
  `endOfTurnMove`; rejects rather than throws — these are client-submitted
  moves) and `playBotTurn(state, gameplay, strategy)` (the bot-turn loop
  factored out of `run-match.ts`, returning the named moves + resulting state).
  Extend the bot-turn-agreement spec to **three hosts** (React shell /
  `runMatch` / `playBotTurn`). Add a JSON round-trip serialization spec over
  every variant start board and match history, and document the contract in
  `types.ts`. Add `startBoardForAttempt(startBoards, attemptIndex)` honoring
  the durer-jatekok#314 append-only order.
- [ ] **PR 1.4 (M)** `packages/games` with the two live games moved wholesale; each
  `<game>.tsx` exports a **config object** instead of calling the factory;
  practice wiring calls `strategyGameFactory(config)` at its one export site.
  Add curated competition `startBoards` for remove-divisor-multiple C/D
  (currently generator-based), each pinned by `forcedWinnerIndex` specs.

### Phase 2 — Competition core (no wiring yet)

- [ ] **PR 2.1 (L, isolated)** `packages/competition`: a pure
  `applyEvent(state, event, gameplay)` state machine —
  `CompetitionMatchState { gameId, category, clock{startAt,endAt},
  tally{tries,losses,streak,points}, attempt{difficulty, roleIndex,
  startBoardIndex, core}, finished }`; events
  `START_ATTEMPT | CHOOSE_ROLE | MOVE | ADD_MINUTES | CLOSE`. The scoring
  ladder (win 2 live games in a row; 12/9/6/4/3/2 points by prior losses) is
  ported from `gamewrapper.ts` and the per-game copies — it lives once here.
  The 10-second late-move grace lives here too, unit-tested. **Golden parity
  tests drive the same scripted sequences through the still-installed old
  `gameWrapper` (bgio headless Client) and through `applyEvent`, asserting
  identical points** — pinned against the real oracle, not a transcription.
- [ ] **PR 2.2 (S)** `packages/schemas`: `engine?: 'bgio' | 'v2'` (default
  `'bgio'`) on match statuses (JSON-in-column — no ALTER); the client-view DTO.

### Phase 3 — Backend swap for strategy (dark launch, side by side)

- [ ] **PR 3.1 (M)** Two additive Sequelize models on the shared instance (created
  with `sync()` like `Teams`):
  - `matches(match_id pk, team_id, kind 'STRATEGY'|'RELAY', game_id,
    state jsonb, version int, timestamps)` — snapshot + optimistic concurrency.
  - `match_events(match_id, seq, actor 'team'|'bot'|'admin'|'system', type,
    payload jsonb, created_at; pk (match_id, seq))` — append-only log; a spec
    replays events through `applyEvent` and reproduces `state`. The bgio
    `Games` table is untouched and coexists.
- [ ] **PR 3.2 (L)** v2 routes in `apps/online-backend/src/server/strategy-v2.ts`:
  - `POST /api/team/:GUID/strategy/start` — reuses the `allowedToStart`/
    stale-check gating; writes an `engine:'v2'` match status.
  - `GET /api/match/:matchID?since=<seq>` — client view + `serverNow` +
    `endAt` + new events (countdown polling and add-minutes pickup ride this).
  - `POST /api/match/:matchID/events` — body `{ knownVersion, event }`; auth
    via `X-Team-Credentials` (the existing per-team credential GUID, the same
    trust level as bgio move signing today); 409 on version mismatch; applies
    the team event, then loops `playBotTurn` until it is the team's turn or
    the attempt ended; persists all events in one transaction; the response
    carries the bot's events (the frontend paces them for display).
  - `closeMatch` v2 from `state.tally.points`; `checkStaleMatch` dispatches on
    `engine`; admin `/state`/`/logs` URLs kept, dispatching by which table
    holds the id; add-minutes becomes an `ADD_MINUTES` event — no transport
    hijack, no `_stateID`. Rollout flag `STRATEGY_V2_CATEGORIES` (env, comma
    list, default empty) chooses per team category at match creation; both
    engines share one process and one Postgres.
- [ ] **PR 3.3 (S)** Supertest conformance: HTTP move sequences produce identical
  boards/winners to `runMatch`/`applyEvent` directly.

### Phase 4 — Frontend swap for strategy

- [ ] **PR 4.1 (L, isolated)** `common-frontend/src/client/strategy-shell/`: one
  component tree for online and offline — difficulty + role choice, the
  existing `Countdown` pointed at the v2 GET, points/tries, end-of-attempt
  flow, and a board adapter rendering `config.BoardClient` with
  `{ board, ctx, moves, setTurnState }`. `moves.<name>` POSTs and applies the
  authoritative response; `.isAllowed` runs `validate` + `buildCtx`
  client-side (the packages are isomorphic, so disabled-state logic is exact,
  not duplicated); bot events are paced for display. Talks through the
  existing `ClientRepository` interface (+3 v2 calls). Tailwind added to both
  competition frontends with content globs over `packages/games`; the board is
  wrapped in the `engine/react` language provider fed from the i18next
  language.
- [ ] **PR 4.2 (M)** online-frontend routing: `engine === 'v2'` → new shell, else
  the untouched bgio client. Delete nothing.
- [ ] **PR 4.3 (S)** Staging pilot + **Rehearsal #1** — a volunteer dry-run: both
  games, add-minutes, reset, a forced timeout, `admin.py` against v2. **Gates
  everything after it.**
- [ ] **PR 4.4 (S)** Production flip (all categories v2); the bgio path is kept as
  an env-flag rollback for one full competition cycle.

### Phase 5 — offline-frontend port

- [ ] **PR 5.1 (M)** `OfflineClientRepository` v2: `applyEvent` + `playBotTurn`
  run in-browser (bot from `packages/games`), the snapshot JSON-persisted to
  localStorage (safe by the PR 1.3 contract); same shell. Scoring and clock
  are identical to online by construction — same `packages/competition`.
- [ ] **PR 5.2 (S)** Delete the offline bgio paths (`myclient.ts`,
  `botwrapper.ts`, `client_factory.tsx`); the gh-pages deploy is unchanged.

### Phase 6 — Relay rebuild (plain REST)

- [ ] **PR 6.1 (M)** Pure problem bank: strip bgio types from
  `packages/strategy/.../relay/strategy.ts`; export `problems[category]` and
  `grade(category, problemIndex, answer)` including the per-try points ladder;
  golden tests against the old relay game.
- [ ] **PR 6.2 (L)** Relay REST on the same `matches`/`match_events` tables
  (`kind:'RELAY'`, 60-minute clock): `POST .../relay/start`,
  `GET /api/relay/:matchID`, `POST .../answer`. Problem text is served per
  current problem only — the bank is never shipped to online clients. Same
  auth/admin/add-minutes dispatch; `RELAY_V2_CATEGORIES` flag; the bgio relay
  is untouched as fallback.
- [ ] **PR 6.3 (M)** Relay frontends rewired behind the `engine` discriminator;
  offline relay runs the same logic locally.
- [ ] **Milestone: Rehearsal #2** — full dry-run with both rounds on v2 and
  `admin.py` end-to-end; **one real competition runs on the new stack before
  Phase 7 deletes anything**.

### Phase 7 — boardgame.io removal + cleanup

- [ ] **PR 7.1 (M)** De-bgio the server: a plain Koa app; delete
  `socketio_botmoves.ts`, both `botwrapper.ts` copies, the
  `injectPlayer`/`injectBot`/bgio branches; remove the nginx `/socket.io/`
  block (which also closes the unauthenticated-lobby-endpoints TODO by
  removing the endpoints).
- [ ] **PR 7.2 (M)** Delete `packages/game` (gamewrapper, the 11 dead game dirs,
  the bgio relay) and the bgio client code; drop `boardgame.io` +
  `bgio-postgres`; delete `.npmrc`. The bgio `Games` table is kept read-only
  until its data is archived — dropped by an admin action later, not by code.
- [ ] **PR 7.3 (S)** ESLint `--max-warnings` ratchet toward 0; un-comment/port
  tests in CI; extend the patch-coverage gate to `packages/*`; docs updates;
  archive the durer-jatekok repo with a pointer README.

## Side-effect payoff: open issues the migration can close

At the time of writing this repo has ~78 open issues; a large share are
obsoleted or directly delivered by migration phases. **Each phase's
completion includes a sweep of the open-issue list**, closing what the phase
resolved with a pointer to the landing PR — this is part of the phase's
definition of done, so the payoff is collected rather than left rotting in
the tracker. Candidates as mapped today (re-check at each sweep; some are
"mostly" rather than "fully" solved):

- **Phase 0 (baseline)**: #161 (typecheck), #215 (eslint CI action), #136
  (devcontainer), #203 (production dockerfile CMD), #122 (backend tests —
  foundation laid, not finished).
- **Phase 2 (competition core)**: #78 (state in strategy), #35 / #79
  (startingPosition mess / per-test-game start positions → curated
  `startBoards` + `startBoardForAttempt`), #18 (`firstPlayer` a string →
  `roleIndex`), #5 (rethink end turn → moves return `isTurnEnd`), #54
  (rethink game over and timer → clock + `CLOSE` events).
- **Phase 3 (backend)**: #174 (timestamps in logs → `match_events.created_at`),
  #51 (getTime via SYNC — obsolete, polling GET), #86 (bgio plugins —
  obsolete), #171 (ctx.currentPlayer vs playerID — obsolete), #17
  (ai.enumerate vs valid moves — `validate` is the single source of truth,
  pinned by conformance specs).
- **Phase 4 (frontend)**: #175 (strategy-game UX → durer-jatekok boards), #4
  (disable/fade → `isAllowed` gating comes with them), #64 (socketio-lost
  alert — obsolete, plain HTTP with retries), #57 (BoardWrapper — deleted),
  #164 (description belongs to strategy — presentation lives in the game
  config), #209 partially (strategy-game descriptions ship `{hu, en}`).
- **Phase 5 (offline)**: #133 (bgio localstorage edge case — rewritten), #168
  (refine localstorage saves).
- **Phase 7 (cleanup)**: #181 / #182 (eslint warnings/strictness — the
  ratchet), plus everything bgio-labeled that remains.
- **Made cheap rather than solved**: #111 (give up a game → one new event on
  the state machine), #15 (spectator mode → the admin state view is already a
  read-only client view), #137 (introduce competitions — the
  `packages/competition` state machine is where that would live).

## Testing strategy

- Phase 0: durer-aion's jest suites and typecheck run in CI (PR 0.0); both CI
  pipelines green on the merged repo; the Pages deploy verified with a
  throwaway commit; the must-keep-working checklist walked once against the
  merged repo to establish the baseline.
- Phase 1: existing engine/game specs move unchanged and stay green;
  three-host bot-turn agreement; the JSON round-trip sweep;
  `forcedWinnerIndex` on every competition start board.
- Phase 2: golden scoring parity against the live old `gameWrapper` —
  boardgame.io still being installed makes it a free oracle.
- Phase 3: event-replay determinism; HTTP conformance vs `runMatch`;
  409/illegal-move/late-move behavior pinned.
- Phases 4–6: shell tests with the existing `MockClientRepository` pattern;
  the rehearsals as integration gates; relay grading goldens.
- Throughout: the patch-coverage ≥85% gate applied to
  `packages/engine|games|competition` from the moment they exist.

## Risks and mitigations

1. **Subtree merge**: a one-way move — durer-jatekok stops receiving code the same
   week; never `subtree pull`; `git log --follow` verified in PR 0.2 review.
2. **Pages from the monorepo**: recreate the `github-pages` environment and
   concurrency group; the custom domain + CNAME keep the URL unchanged;
   verified before durer-jatekok is archived.
3. **Two React/tooling versions in one workspace** (React 19 vs 18, ESLint,
   TS): isolated to PR 0.3; npm nests versions per workspace; convergence is
   deliberately out of scope until after Phase 7 — the BoardClients use no
   React-19-only APIs, verified by the shell tests running under React 18.
4. **Scoring parity**: golden tests against the running old implementation,
   plus the Rehearsal #1 cross-check.
5. **Sequelize drift**: additive `sync()` tables only; the `engine` field is
   JSON-in-column, no ALTER.
6. **`admin.py` / log shape**: admin URLs preserved; the payload becomes
   `CompetitionMatchState` + `match_events`; `admin.py` updated in Phase 3 and
   exercised in both rehearsals; bgio-era matches stay readable until archived.
7. **Concurrent tabs / double submit**: `version`/`knownVersion` + 409 +
   client re-fetch — one integer replacing bgio's `_stateID`.
8. **Clock trust**: server `serverNow`/`endAt` in every response; the grace
   rule is unit-tested in `packages/competition`, not buried in transport.
9. **i18n divergence**: boards keep the `{hu, en}` mechanism via the provider;
   competition chrome stays i18next; the `i18n:check` globs are updated so it
   doesn't fire on `packages/games`.
10. **Volunteer bandwidth**: every phase boundary is a safe stop with both
    rounds playable; only the two rehearsals are hard gates before a real
    competition.
11. **Migration churn vs an active private repo**: refactoring the repo shape
    while a year's private repo carries an unmerged secret game forces the
    game team to absorb the refactors through `-X ours` syncs repeatedly.
    Mitigation: schedule the disruptive phases between private-repo cycles,
    sync right before each year's cut, and keep the secret delta to the one
    game folder so merge-backs stay small. The rehearsal competitions
    themselves exercise the private-repo flow end to end.

## Ordering rationale

Baseline before anything else: pinned toolchain, running tests and the
must-keep-working checklist are what make "everything keeps working" a checked
property instead of an assertion, and every later PR is reviewed against that
net. Merge next so engine hardening lands once, reviewed under durer-jatekok's CI
culture. Engine extraction before any competition code because the server API
and the serialization contract are prerequisites for both the backend and the
offline work. The competition state machine before transport so scoring parity
is pinned against the still-installed boardgame.io oracle. Backend before
frontend so the flag-gated dark launch carries zero user risk. Strategy before
relay because strategy exercises every new mechanism while relay is a plain
CRUD reuse of the same tables. The offline port sits after the shell exists
because it is mostly the same code with a local repository. Deletion strictly
last, after a real competition has run on the new stack.
