# Changelog

The notable changes, a month at a time. A section is written once the month is
over, from the pull requests merged in it, and is a summary of them rather than a
list: at most about eight bullets, each saying what an organiser, a tester, a
visitor or the next maintainer would notice. Refactors, dependency bumps, CI and
docs make the cut only when they change how someone works. A quiet month gets one
line. The merged pull requests are the full record.

## September 2026

- **Team sessions are safer.** A team's session lives in an HttpOnly cookie
  instead of the URL, team secrets and match metadata are no longer served to
  unauthenticated callers, and guessing a join code is rate-limited (#433, #419,
  #458)
- **Organisers can undo a team deletion**: a tab lists deleted teams, with
  restore and batch delete. Team lookup ignores case, and the results TSV has the
  right columns and is built from fresh match data (#477, #478, #506, #569)
- **The live client no longer ships the bot.** The game package has separate
  shared, bot and client entries, and a test fails if the bot reaches the served
  bundle (#429)
- **The backend is one tsdown bundle built from the packages' source**, and the
  packages ship ESM only (#422, #423)
- **Deploying is documented and checked.** DEPLOYMENT.md is rewritten against the
  real stack, nginx takes TLS through an include, CI builds the docker images,
  and the testers' dry run deploys to the year's private repo again (#305, #455,
  #435, #492, #486)
- **The public sites share one look**: the strategy practice site is restyled
  after the online round, and the homepage takes the practice sites' green.
  `/jatekok/` falls back to the browser's language (#404, #538, #548, #482)
- **Round fixes**: resetting a match closes only the team's current match, and
  the clock poll no longer uses up a turn's move limit (#535, #510)
- **Formatting is ESLint's**, through `@stylistic`, from one config for the whole
  repo (#398, #407)

## August 2026

- **One repo, one deploy for the public sites.** The strategy practice site
  moved in from durer-jatekok and joined the npm workspaces, and one Pages
  workflow builds `/jatekok/`, `/valto/` and `/proba-verseny/` together, served
  from gyakorlo.durerinfo.hu (#238, #244, #256, #262)
- **New relay practice site** at `/valto/`, with a way back to the choice between
  relay and strategy practice (#224, #403)
- **boardgame.io stays.** A plan to replace it was started and then retired, and
  its unused packages removed; the React-free engine it extracted remains as
  `packages/strategy-engine` (#225, #261, #287, #288)
- **React 19 across the monorepo**, with Recoil replaced by a
  `useSyncExternalStore` store and tsup by tsdown (#253, #252, #282)
- **CI gates the basics**: typecheck, vitest suites and spell-check in Hungarian
  and British English, on a pinned toolchain (#233, #232, #391, #229)
- **Stricter types**: `no-explicit-any` and the type-aware lint rules are on,
  including in the strategy practice site (#292, #357, #358, #365)
- **Admin and deployment hardening**: state-changing admin endpoints are POST, the
  team filter escapes LIKE wildcards, compose defaults suit a deployed host, and
  the database runs the official postgres image (#323, #351, #310, #311)
- **The admin page can export the team table**, and the twelve unreferenced past
  games are gone (#312, #333)
