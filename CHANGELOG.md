# Changelog

The notable changes, about a month at a time. Each section covers the pull
requests merged since the previous one, up to the date in its heading, and is a
summary of them rather than a list. A quiet month gets one line. The merged pull
requests are the full record.

Each section opens with what a contestant, an organiser, a tester or a visitor to
the practice sites would notice, at most about eight bullets. *For developers*
follows, at most about five: only what changes how someone works in this repo —
a new command or gate, a removed package, a new convention — or a decision they
need to know. What was refactored is not enough.

## September 2026, as of 2026-09-28

- **Team sessions are safer.** A team's session lives in an HttpOnly cookie
  instead of the URL, team secrets and match metadata are no longer served to
  unauthenticated callers, and guessing a join code is rate-limited (#433, #419,
  #458)
- **The bot's strategy is no longer in the page contestants load** (#429)
- **Organisers can undo a team deletion**: a tab lists deleted teams, with
  restore and batch delete. Team lookup ignores case, and the results TSV has the
  right columns and is built from fresh match data (#477, #478, #506, #569)
- **The testers' dry run can be published again**, to the year's private repo
  (#492, #486)
- **The public sites share one look**: the strategy practice site is restyled
  after the online round, the homepage takes the practice sites' green, and
  mobile layouts are fixed. `/jatekok/` falls back to the browser's language
  (#404, #538, #482, #548)
- **Round fixes**: resetting a match closes only the team's current match, and
  the clock poll no longer uses up a turn's move limit (#535, #510)

### For developers

- `packages/game` has separate shared, bot and client entries; a game's bot and
  board share nothing but `game.ts`, and a test fails if the bot reaches the
  served bundle (#429)
- The backend is one tsdown bundle built from the packages' source, and the
  packages ship ESM only (#422, #423)
- Formatting is ESLint's, through `@stylistic`, from one config for the whole
  repo — no prettier (#398, #407)
- DEPLOYMENT.md is rewritten against the real stack; nginx takes TLS through an
  include, and CI builds the deployed docker images (#305, #455, #435)
- Agent instructions live in `AGENTS.md`, for every agent; `CLAUDE.md` only
  imports it (#581)

## August 2026, as of 2026-08-31

- **The strategy practice site joins the other public sites**: it moved into
  this repo, and one deploy serves `/jatekok/`, `/valto/` and `/proba-verseny/`
  from gyakorlo.durerinfo.hu (#238, #244, #262)
- **New relay practice site** at `/valto/`, with a way back to the choice between
  relay and strategy practice (#224, #403)
- **The relay answer form** checks an answer only once it is submitted, and its
  error line no longer shifts the form (#336, #334)
- **The admin page can export the team table**, and its team filter matches `%`
  and `_` literally (#312, #351)
- **Pages stay up** when the latex.js CDN is unreachable, and game routes no
  longer crash over plain http (#264, #266)
- **The Dürer dragon is the favicon everywhere** (#273)

### For developers

- `apps/strategy-practice` is a workspace, with its own ESLint and vitest configs
  run alongside the rest (#238, #256)
- boardgame.io stays: the replacement plan is retired; its React-free engine
  remains as `packages/strategy-engine` (#287, #288)
- React 19 throughout; Recoil and tsup are gone (#253, #252, #282)
- CI gates typecheck, tests and spell-check, on a pinned toolchain (#233, #232,
  #391, #229)
