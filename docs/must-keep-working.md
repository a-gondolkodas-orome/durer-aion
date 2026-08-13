# What must keep working

The regression checklist for the boardgame.io replacement migration
(`docs/boardgame-io-replacement-plan.md`).

Every phase of that migration is verified against this list: **a phase is done
only when each item below still holds**. Items are removed only when a
capability is deliberately retired by a phase — with an inline note saying
which PR retired it and what replaced it.

This is a hand-walked checklist, not an automated suite. Where an item is
covered by a test or a CI job, that is noted; everything else is checked by
someone actually doing it.

## Online competition round

- Team login by join code; disclaimer → chooser flow.
- A team can start, play and finish a **strategy** match against the server
  bot, in both test and live mode, with role choice, streak scoring and the
  30-minute countdown.
- A team can start, play and finish a **relay** match: problems are served,
  answers accepted with 3 tries and decreasing points, on the 60-minute clock.
- Reload or disconnect mid-match resumes without loss of state.
- A second browser tab cannot corrupt a running match.
- The clock cannot be gamed from the client.
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

## Offline practice build

- The gh-pages build serves the competition games with the in-browser bot and
  localStorage persistence that survives a reload.

## Practice site

*(Applies from the subtree merge in PR 0.2 on, when durer-jatekok becomes
`apps/practice`.)*

- `jatek.durerinfo.hu` serves the site and deploy-on-main works.
- Every game is playable in both modes.
- Its existing CI gates — lint, typecheck, unit tests, patch coverage — stay
  green.

## Competition secrecy flow

See the plan's "Competition secrecy: the yearly private-repo flow" section for
why this matters.

- Pushing a `sync-*` branch mirrors it into the year's private repo
  (`sync.yml`).
- A competition game can be developed and deployed from the private repo with
  zero trace in the public repo.
- The post-competition merge-back PR publishes that game as a practice game.

## Developer workflows

*(Phase 0 principle: existing workflows break only where unavoidable. New
tooling arrives alongside the existing setup, not instead of it.)*

- `npm ci` at the repo root installs everything.
- `npm run dev:server`, `npm run dev:online`, `npm run dev:offline` start what
  they say they start.
- The docker-compose dev flow from the README works, backend auto-reload
  included.
- The setup steps written in `README.md` are accurate.
