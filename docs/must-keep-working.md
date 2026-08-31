# What must keep working

The standing regression checklist for this repo: what the two sites and the
live competition must keep doing through any change.

Structural changes are verified against this list: **a change is done only
when each item below still holds**. Items are removed only when a capability
is deliberately retired — with an inline note saying which PR retired it and
what replaced it.

This is a hand-walked checklist, not an automated suite. Where an item is
covered by a test or a CI job, that is noted; everything else is checked by
someone actually doing it. `README.md`, under *Checking it works*, is how:
which command brings up what, and which URL and join code exercises each item
below.

## Online competition round

- Team login by join code; disclaimer → chooser flow. *(The session half —
  a join code loading its team, and a logout dropping the saved match with it —
  is covered by `user-model.test.ts`.)*
- A team can start, play and finish a **strategy** match against the server
  bot, in both test and live mode, with role choice, streak scoring and the
  30-minute countdown.
- A team can start, play and finish a **relay** match: problems are served,
  answers accepted with 3 tries and decreasing points, on the 60-minute clock.
  *(The round against the bot — problems served, the three tries and what each
  is still worth — is covered by `strategy.test.ts`.)*
- Reload or disconnect mid-match resumes without loss of state. *(The rules
  deciding what a returning team may start, and the closing of a match whose
  time ran out while it was away, are covered by `team_manage.test.ts`.)*
- A second browser tab cannot corrupt a running match.
- The clock cannot be gamed from the client. *(Covered by
  `gamewrapper.test.ts`: the time left is recomputed from the match's own end,
  and only the team may poll for it.)*
- The served online bundle contains no bot strategy — competitors must not be
  able to read the bot out of the client. *(By hand: build, then grep
  `apps/online-frontend/dist` for a string from the bot's lookup tables.)*
- The final score (relay + strategy) shows on the finished screen.

## Admin / operations

- TSV team import works over HTTP and via the CLI script
  (`scripts/import_teams.sh`).
- Admin pages: team list, per-team detail, per-match state dump, per-match log
  dump, per-category stats.
- Admin actions on running matches: add minutes, relay reset, strategy reset,
  soft team delete.
- `scripts/admin.py` pulls all teams and match data for post-competition
  scoring. *(The payload shape changes in Phase 3; `admin.py` is updated in
  the same phase and exercised in both rehearsals.)*
- The deployment runbook in `DEPLOYMENT.md` works: `docker compose up` yields a
  serving stack, team import runs inside the container, and Sentry receives
  events.

## Offline dry-run build (`/proba-verseny/`)

- The gh-pages build serves the competition games with the in-browser bot and
  localStorage persistence that survives a reload.

## Strategy practice site

*(Applies from the subtree merge in PR 0.2 on, when durer-jatekok became a
workspace — `apps/practice` then, `apps/strategy-practice` since the rename.)*

- `jatek.durerinfo.hu` serves the site and deploy-on-main works.
- Every game is playable in both modes.
- Its existing CI gates — lint, typecheck, unit tests, patch coverage — stay
  green.

## Relay practice site

*(Applies from #224, which replaced the frozen 2023 build at `/valto/` with
`apps/relay-practise-frontend`.)*

- `/valto/` on the Pages site serves the relay practice: pick a past year's
  problem set and play it through against the in-browser bot, with
  localStorage persistence that survives a reload.

## Competition secrecy flow

See `README.md`, under *Competition secrecy*, for why this matters.

- Pushing a `sync-*` branch mirrors it into the year's private repo
  (`sync.yml`).
- A competition game can be developed and deployed from the private repo with
  zero trace in the public repo.
- The post-competition merge-back PR publishes that game as a strategy
  practice game.

## Developer workflows

*(Phase 0 principle: existing workflows break only where unavoidable. New
tooling arrives alongside the existing setup, not instead of it.)*

- `npm ci` at the repo root installs everything.
- `npm run dev:server`, `npm run dev:online`, `npm run dev:offline` and
  `npm run dev:relay-practice` start what they say they start.
- `npm run setup` seeds every env file the README expects, and overwrites none.
- The docker-compose dev flow from the README works — `npm run stack:up` then
  `npm run teams:import` — backend auto-reload included.
- The setup steps written in `README.md` are accurate.
