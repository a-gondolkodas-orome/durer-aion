# Changelog

The notable changes, about a month at a time. Each section covers the pull
requests merged since the previous one, up to the date in its heading, and is a
summary of them rather than a list. A quiet month gets one line. The merged pull
requests are the full record.

Each section opens with what a contestant, an organiser, a tester or a visitor to
the practice sites would notice, at most about eight bullets. *For developers*
follows, at most about five: only what changes how someone works in this repo —
a new command or gate, a removed package, a new convention — or a decision they
need to know. What was refactored is not enough. In both parts the most important
comes first, not the earliest merged.

## October 2026, as of 2026-10-31

- **The 20th online round's games are public** (#659, #660)
- **Teams see their results in detail**: a running points table under the relay
  clock, the live games so far on the strategy board, and per-problem and
  per-game tables on both end screens and the home page (#611, #610)
- **boardgame.io's unauthenticated lobby API under `/games` is closed** (#636)
- **Team deletion is gone**, with the archive of deleted teams: deleting a team
  mid-round let it play on. Organisers can instead reveal a team's email and join
  code in its dialog, the match log stamps each move with its time, and the TSV
  import accepts uploads again (#646, #648, #551, #602, #638, #511)
- **A relay whose time ran out keeps its score** in the dry run and on
  `/valto/`, where closing the end dialog used to record 0 (#653)
- **A refreshed look**: the general Dürer logo with round favicons, login pages
  on a card, relay math in KaTeX's own fonts, side margins at every width, and
  notifications above a phone keyboard (#588, #606, #592, #635, #591, #600)
- **The practice sites and the public dry run are tracked in umami**; `/valto/`
  remembers the language choice, and browsers no longer offer to translate the
  pages (#605, #607, #629, #654, #546)

### For developers

- Database code is tested against a real postgres, in process through PGlite —
  no docker, so it runs in `npm run check` (#632, #664)
- The strategy practice site is on i18next; the old `{ hu, en }` translation
  framework is removed (#614–#620, #622)
- React hook rules are linted across the repo, not only in the strategy
  practice site (#566, #563, #564, #565)
- Production stack: every compose command keeps the TLS override, nginx has a
  health check so `up --wait` waits for a site that answers, browsers revalidate
  the files whose names carry no hash, and DEPLOYMENT.md covers restarting the backend mid-competition
  (#579, #657, #590, #571)
- Agents read `AGENTS.md` with no `CLAUDE.md` stub, push to a descriptive
  `claude/` branch, and ask before posting to a PR, watching one or writing to an
  issue (#584, #603, #593, #627, #644)

## September 2026, as of 2026-09-28

- **Team sessions are safer.** A team's session lives in an HttpOnly cookie
  instead of the URL, team secrets and match metadata are no longer served to
  unauthenticated callers, and guessing a join code is rate-limited (#433, #419,
  #458)
- **The bot's strategy is no longer in the page contestants load** (#429)
- **Round fixes**: resetting a match closes only the team's current match, and
  the clock poll no longer uses up a turn's move limit (#535, #510)
- **Organisers can undo a team deletion**: a tab lists deleted teams, with
  restore and batch delete. Team lookup ignores case, and the results TSV has the
  right columns and is built from fresh match data (#477, #478, #506, #569)
- **The testers' dry run can be published again**, to the year's private repo
  (#492, #486)
- **The public sites share one look**: the strategy practice site is restyled
  after the online round, the homepage takes the practice sites' green, and
  mobile layouts are fixed. `/jatekok/` falls back to the browser's language
  (#404, #538, #482, #548)

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
