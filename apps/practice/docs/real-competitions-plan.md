# Supporting Real Competitions — High-Level Plan

Status: **draft / planning** — not yet scheduled. This document captures the
target design and a phased path to get there. Nothing here is built yet.

## Goal

Let the site be used to run the **game round of a real Dürer competition**, not
just for practice. During a competition:

- Each team is given a **new game** (authored for that competition).
- Teams may practice that game **freely** in **Test mode** or **2-player mode**
  — any number of times, no limits.
- To score, a team enters **competition mode** and plays against the
  **smart (optimal) bot**. The team must **win two games in a row**.
- Each competition game starts from a **fixed start board**; the team then
  **chooses a role** — role choice is part of their strategy.
- Thinking time is **limited by a timer**.
- A team may **retry** (up to 2 further attempts) for **fewer points**.
- Games are **validated server-side**, the **smart bot strategy is not readable
  from client-side code**, and **results are saved server-side per team**.

## Why this is a real architectural change

Today the project is a deliberately **static, client-side, no-backend** site
(GitHub Pages). The practice experience can and should stay that way. But the
competition requirements above cannot be met by a static site:

- **Server-side validation** — the client cannot be trusted to score itself.
- **Non-sniffable smart bot** — the optimal strategy must not ship in the JS
  bundle, so it has to run on a server.
- **Per-team persisted results, timer, retries** — all must be tamper-proof and
  therefore authoritative on the server.

So the site becomes a **hybrid**: the static practice site continues as-is, and
a **new backend service** powers competition mode only.

### What lives where

| Concern | Location | Rationale |
|---|---|---|
| Test mode, 2-player mode, all UI | Client (unchanged) | Unlimited practice; nothing to protect |
| Test / easy bot | Client (unchanged) | Meant to be beatable; sniffing is fine |
| Move legality + win detection | Shared engine (browser **and** Node) | Client renders with it; server validates with it |
| **Smart bot strategy** | **Server only** | The "not sniffable" requirement |
| Match state, clock, streak, retries, scoring, results | **Server** | Authoritative and tamper-proof |

The existing `strategyGameFactory` API is already close to what's needed: moves
are pure reducers (`(board, { ctx }, ...args) => MoveOutcome`) paired with pure
`validate` predicates, and the interpreter that runs them
(`strategy-game-factory/engine/`) is deliberately React-free, so move legality
and win detection already run headless in Node. Bot strategies
(`({ board, ctx, moves }) => void`) dispatch moves instead of returning them,
which is the part that still needs work.

## The four server-authoritative signals

Everything the server must own during a competition match rides a single
**match loop**:

| Signal | Server owns | Prevents |
|---|---|---|
| Start board | predefined board per (attempt, game slot) | board-fishing / reusing a solved board |
| Move validation | authoritative board + legality rules | illegal or cheated moves |
| Smart bot reply | strategy code, server-side only | reading the answer from source |
| Clock | server timestamps + time budget | tampering with thinking time |

**Role choice** is a team **input** the server records (it does not strip the
role chooser out) — the team picks a role, the server drives the smart bot as
the **opposite** role.

## Per-game competition flow

1. Server issues the **fixed start board** for this (attempt, game slot).
2. Team **chooses a role** (client chooser, retained) → sent to server.
3. Server plays the **opposite role** with the server-side smart bot, validates
   every team move against its own authoritative board, and enforces the clock.
4. Win / loss / timeout feeds the **streak + retry** state machine, and the
   outcome is persisted per team.

## Scope-limiting insight

Each competition uses **new games**, so competition mode does **not** need to be
retrofitted onto all ~40 existing games. We build the backend framework **once**
against a **pilot game**, then each future competition game ships a server engine
+ smart bot as it is authored. The `new-game` workflow grows accordingly (see
Phase 5).

## Correctness constraint for start boards

Because the team must **win** against an optimal bot, and role choice is theirs:

- Each start board must be a **decisive position** — one role can **force a
  win**. (True for essentially any position in these determined games; only games
  that admit draws need care so that some side can genuinely force a win.)
- Prefer **non-obvious** positions, where it isn't trivially clear which role
  wins, so the role choice is a real strategic decision rather than a giveaway.

This is the opposite of the practice guideline in `AGENTS.md` ("~50/50 win
probability across random boards"): competition boards are **hand-curated and
verified** so that correct role choice + optimal play always wins.

## Phased plan

### Phase 0 — Specify the exact rules (blocking, cheap)

Pin down the details that shape the backend before building it:

- **Scoring / streak state machine.** Proposed default (to confirm): an
  *attempt* is a run at "2 wins in a row"; a loss or timeout breaks the streak
  and ends the attempt; **3 attempts total** (original + 2 retries), each worth
  fewer points, full points on attempt 1.
- **Timer model.** Per-move, per-game, or a total thinking-time bank per attempt?
  Does a timeout equal an instant loss (breaking the streak)? Confirm the bot's
  reply time is **not** charged to the team.
- **Board sets.** How many curated boards, and how they map to (attempt, game
  slot) so retries don't reuse a board the team already solved.
- **Team identity.** Where team codes come from — Dürer's existing system vs
  organizer-generated codes.
- **Practice lockout.** Whether practice stays open once competition mode starts.

### Phase 1 — Extract a headless game engine

Refactor the pure logic (board type, moves, legality, win detection) out of the
React components into a **framework-free module runnable in both browser and
Node**. Do it for a **pilot game first**, not the whole catalog. The smart bot
strategy is split into a **server-only** module that the client build never
imports. Needs test coverage.

Partly done already: the move interpreter, the game store and the `ctx`
derivation live in `strategy-game-factory/engine/`, which imports no React. What
remains is per game — most game files still keep their moves in the same `.tsx`
as their JSX rule text — plus the server-only split of the smart bot.

### Phase 2 — Stand up the backend

Choose host + storage (a small Node service or serverless functions;
SQLite / hosted Postgres / KV). Implement the **authoritative match loop** for
the pilot game: issue start board, accept role choice, validate moves, drive the
server-side smart bot, enforce the clock, detect win/loss/timeout.

### Phase 3 — Competition mode in the client

A locked-down mode layered on the existing `Ctx`: retains the role chooser,
disables restart / variant switching / hints, shows a **server-driven countdown**
(display only — the server is the clock authority), and talks to the backend
instead of the local bot. Entered via a **team code**.

### Phase 4 — Scoring, retries, timer enforcement, results

Implement the streak + retry + tiered-points state machine and the timer
enforcement server-side, persist per-team results (keyed by team, game, attempt),
and add an **organizer-facing results / standings** view.

### Phase 5 — Harden & operationalize

- Anti-cheat review: rate limits, replay/tamper checks, no strategy leakage via
  responses or timing, clock keeps running across disconnect/refresh.
- Team-code issuance flow.
- Load check for many concurrent teams.
- Extend the `new-game` workflow: competition games must ship a **server engine
  + smart bot** and **curated, verified-winnable start boards**.

## Alternative: reuse the existing `durer-aion` competition platform

Instead of turning this repo into a full-blown competition engine (backend,
match loop, auth, results storage — all built from scratch), we could take the
opposite direction: **keep this repo as the static practice site, and move the
game logic into the `a-gondolkodas-orome/durer-aion` monorepo**, which already
runs real competitions.

That monorepo already has the hard parts this plan would otherwise rebuild:
server-authoritative match state, team identity, timers, results persistence,
and an organizer surface. It currently uses **`boardgame.io`** as its game
engine. The proposal is to **replace the `boardgame.io` package with our
`strategyGameFactory`** as the engine there.

Why this is attractive:

- **No new backend to design or operate.** The four server-authoritative signals
  (start board, move validation, smart bot, clock) already have a home.
- **`strategyGameFactory` is a natural fit.** Its moves are pure reducers
  returning a `MoveOutcome`, and its interpreter is already framework-free; that
  maps onto a `boardgame.io`-style engine slot more directly than onto a bespoke
  service.
- **Division of labour matches reality.** This repo stays a lightweight,
  no-backend practice site (its original purpose); competition concerns live
  where competition infrastructure already exists.

Open questions before choosing this path:

- How cleanly `strategyGameFactory`'s API maps onto `boardgame.io`'s engine
  contract (moves, turn order, game-over detection, bot/AI hook) — and how much
  of `boardgame.io` the monorepo depends on beyond the engine core.
- Where the **shared engine module** lives so both repos consume it (published
  package vs. copied vs. monorepo-owned with this repo importing it).
- Keeping the **smart bot server-only** still applies, but the monorepo may
  already have a pattern for it.

This is a genuine fork in the road: **build the engine here** (Phases 1–5 above)
vs. **contribute the engine to `durer-aion`** and let it own the competition
runtime. Deciding this early changes almost everything downstream.

## Biggest risks / decisions to make early

- **Build vs. reuse `durer-aion`.** The single biggest decision (see section
  above): stand up a new backend in this repo, or move the engine into the
  existing competition monorepo and replace its `boardgame.io` package.
- **Hosting.** GitHub Pages cannot run a backend. Either keep Pages for the
  static site plus a separate backend host, or migrate to a platform that serves
  both. (Largely moot if we reuse `durer-aion`.)
- **Engine-extraction cost.** How cleanly each game's logic separates from React
  — the pilot game will tell us how heavy this is per game. (Relevant either way,
  and doubly so if the engine must satisfy `boardgame.io`'s contract.)
