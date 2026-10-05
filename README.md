# Durer Online Round framework

Real-time multiplayer framework for online math competitions with interactive
games, built on top of boardgame.io. The public demos are the
[relay practice site](https://gyakorlo.durerinfo.hu/valto/), in Hungarian, and
the [strategy games](https://gyakorlo.durerinfo.hu/jatekok/), which offer
English as well.

# Getting Started

New here? [`CONTRIBUTING.md`](CONTRIBUTING.md) is the shorter way in.

## Requirements

- [Node.js](https://nodejs.org/), the version in [`.nvmrc`](./.nvmrc) —
  `nvm use` anywhere in the repo picks it up. Another 24.x will most likely work
  too, but CI runs exactly this one.
- [Docker](https://www.docker.com/), with your user in the `docker` group so the
  commands below need no `sudo` — `docs/DEPLOYMENT.md` has the three lines that do
  it. Plain `sudo docker …` works too, but never `sudo npm run …`: that runs npm
  as root and leaves root-owned files behind in `node_modules`.

## The whole online-round stack in four commands

```bash
npm ci
npm run setup         # creates the gitignored .env files from their samples
npm run stack:up      # builds the site, then starts nginx + backend + postgres
npm run teams:import  # loads scripts/test.tsv
```

Coming back to a checkout you already have — switching to a branch to review it,
say — is `npm run stack:up` on its own. Every `dev:*` and `stack:*` script runs
`scripts/prepare.mjs` first, which installs and seeds only if it has to: the
install happens when the lockfile or a workspace manifest actually moved.

Open `http://localhost` and log in with the join code `000-0000-000`. That is
the whole online round: the site teams see, the game server they play against,
and the database behind it.

| where | what |
| --- | --- |
| `http://localhost` | the competition site — team login, chooser, relay and strategy matches |
| `http://localhost/admin` | the admin pages; basic auth, user `admin`, password `ADMIN_CREDENTIALS` from `.env.docker` |
| `localhost:5432` | postgres, not a web page: a database client or `psql -h localhost -U postgres`, password `POSTGRESQL_PASSWORD` from `.env.docker` |

`stack:up` returns once the containers are actually up and fails if they are
not, and it runs in the background. `npm run stack:logs` follows all three
containers (Ctrl-C stops watching, not the stack); `npm run stack:down` stops
it. The imported teams cover the three age categories: `000-0000-000` is C,
`001-0000-000` is D, `002-0000-000` is E, with a thousand more behind them.

**Only one of the two flows at a time.** The stack's postgres and
`npm run db:up` both bind 5432, so `stack:up` fails while the other one holds
it. Stop the one you are not using first.

<details><summary>In the dev container, and moving the port</summary>

Everything above works unchanged: the inner dockerd publishes port 80 on the
container's own interfaces, VS Code forwards it, and `http://localhost` is the
address. In a Codespace take the address from VS Code's **Ports** panel instead
— it is a rewritten `*.app.github.dev` URL. A port appears there only once
something binds it, so an empty panel means the stack is not running.

If something already holds port 80, `WEB_PORT=8080 npm run stack:up` moves the
stack; read `8080` for `80` in everything above.
</details>

<details><summary>When a URL shows nothing</summary>

`npm run stack:ps` says which services are up, `npm run stack:logs` why one is
not. If `stack:up` itself fails with `network <id> does not exist`, that is
docker's own state — usually its daemon restarted while an earlier stack was
still around. `npm run stack:down` and retry; if it repeats, restart docker. The
`postgresdb` volume survives all of that, so imported teams do not need loading
again.
</details>

<details><summary>Editing code with the stack up</summary>

The backend reloads itself: `stack:up` adds the `docker-compose.dev.yml`
overlay, which mounts the backend and shared package sources and runs
`npm run dev:server` in the container. `npm run stack:logs` is where you see it
reload, and where a crash on your edit shows up. Routing changes and Koa hooks
are the exception, and a new backend dependency needs the image rebuilt —
`stack:up` again.

nginx serves the frontend from `apps/online-frontend/dist` on the host, so a
frontend change needs `npx turbo build --filter=online-frontend` and a page
reload — the same build `stack:up` runs, and the only one the stack reads. The
docker-less route below reloads it for you.

`stack:up` deliberately builds no further than that: the offline dry run, the
two practice sites and the backend's host-side bundle are not what the
containers serve, and building them here only made `stack:up` an accidental
whole-repo check. `npm run build` is still that check, and CI's `build` job is
where it is enforced.
</details>

## Running it without docker (except the database)

Everything reloads, including the frontend. Three terminals, then the import
once, then `http://localhost:5173`:

```bash
npm run db:up       # postgres in a throwaway container
npm run dev:server  # backend on :8000
npm run dev:online  # frontend on :5173
npm run teams:import:local
```

Vite proxies the backend's routes and the socket to `:8000`
(`apps/online-frontend/vite.config.ts` carries the same map as
`apps/online-frontend/nginx/nginx.conf`), so the page talks to one origin as it
does behind nginx — the session cookie needs that. It is still Vite standing in
for nginx, so anything touching routing, the socket transport or the built
assets wants a `stack:up` run before you believe it.

`db:up` keeps its data inside the throwaway container, so stopping it discards
everything. The docker stack keeps postgres in a named volume:
`npm run stack:down` preserves it, `npm run stack:down -- --volumes` wipes it.

### Which of the two a review needs

Reaching for `stack:up` out of habit pays for an image build on changes that
never touch the image. This route is enough for game logic, the boards and
any backend route the vite proxy carries — and it reloads while you are still
reading the diff. Take `stack:up` when the change is one Vite cannot stand in
for: nginx and its routing, the socket transport, the session cookie's `Secure`
flag, the built bundle itself, or the admin pages, whose behaviour behind the
proxy nobody has walked (see *Admin* below). When in doubt the
paragraph above is the rule — Vite is standing in for nginx, so anything about
nginx wants the stack.

## Running the production stack

```bash
npm run stack:prod
```

What a deployed instance runs (see [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)): the same
compose file without the dev overlay, so the container runs the server compiled
into the image instead of a watcher, code changes need the command again, and
postgres is reachable only from the `backend` container. Detached like
`stack:up`. Worth a run before a competition, and before merging anything that
touches the `Dockerfile`, nginx or the routes.

# Operations

## Admin

The admin pages are at `http://localhost/admin`, user `admin`, password from
`.env.docker`; `/admin/<teamId>` opens one team directly.

Team import has two paths: `npm run teams:import`, which runs
`scripts/import_teams.sh` inside the container, and `PUT /team/admin/import`,
which takes the TSV as an upload; the admin page has no form for it. The first
is its own process — `dist/import_teams.js`, which reads `DATABASE_URL` and
nothing else, so no credential has to be set for a TSV to load (#190). It
reaches that process with `docker compose exec`, so the backend container still
has to be up; `teams:import:local` runs the same code with nothing in front of
it, and imports against a server that will not boot. Two fixtures feed those:
`scripts/test.tsv` is the happy path — the file `teams:import` loads — and
`scripts/unit_test.tsv` is the one shaped for the rejections, its team names
saying what each row is for: the cells to blank so the importer generates them,
the empty row to leave in, the duplicated login code and duplicated credentials
only a real database refuses. `team_import_route.test.ts` uploads it through
the route, but over a stub repository, so the duplicates still need importing
it by hand against a real database.

`scripts/admin.py` is the post-competition scoring pull. Run it on your own
machine, from a checkout, against the production site, not on the competition
server: it needs Python packages the server has no reason to carry, and what it
writes is keyed by join code, the teams' login secret. On macOS or Linux:

```bash
python3 -m venv .venv
.venv/bin/pip install -r scripts/requirements.txt
DURER_BASE_URL=https://verseny.durerinfo.hu .venv/bin/python scripts/admin.py   # prompts for the password
```

On Windows, in PowerShell:

```powershell
py -m venv .venv
.venv\Scripts\pip install -r scripts\requirements.txt
$env:DURER_BASE_URL = 'https://verseny.durerinfo.hu'; .venv\Scripts\python scripts\admin.py
```

It writes the match data (`match_data_*.json`) and the results
(`durer-results-<year>.tsv`) to `scripts/admin-output/`, wherever it is run
from, and prints the results file's full path when it is done; `.gitignore`
and `.dockerignore` both keep that folder out.

- `DURER_ADMIN_PASSWORD` — the backend's `ADMIN_CREDENTIALS`; the script holds
  no credential of its own. Unset it prompts, and with no terminal to prompt on
  it stops rather than sending an unauthenticated request.
- `DURER_BASE_URL` — defaults to `http://localhost:8000`, right against
  `dev:server`, for trying the script on local data. Against the docker stack it
  must be `http://localhost`: port 8000 is not published, nginx proxies `/team`
  and `/game`.

Whether the browser's password prompt appears for the admin pages' XHRs under
the `dev:online` proxy has not been walked, so check them against `stack:up`.

## The other sites

Each runs with no backend and no database, and each persists to localStorage.

| what | run it | notes |
| --- | --- | --- |
| the offline dry run (`/proba-verseny/`) | `npm run dev:offline` | the rehearsal of the competition round, against the in-browser bot. With `VITE_S3_*` set — the competition-year build, not this one — every strategy move also uploads a `_stratstep_` file, and its `log` is the entries the live round's admin dump serves |
| the relay practice site (`/valto/`) | `npm run dev:relay-practice` | #224 replaced the frozen 2023 build |
| the strategy practice site (`/jatekok/`) | `npm run dev:strategy-practice` | on port 8012, not 5173 |

The Pages site assembles all three plus a home page:

```bash
npm run site:build   # home + /jatekok/ + /proba-verseny/ + /valto/ into site/
npm run site:serve   # on http://localhost:4321
```

`site:build` is the same script `.github/workflows/pages-deploy.yml` runs, base
paths and the CNAME assertion included, so this is the artifact a push to `main`
would publish. Worth a look before merging anything that touches an app on the
site, because the workflow going green *is* the cutover — there is no staging
step between it and gyakorlo.durerinfo.hu. What it cannot reproduce is the
upload itself and GitHub's serving behaviour around 404s. To match CI's clean
tree and Node as well, run it under
`docker run -v "$PWD":/w -w /w node:$(cat .nvmrc) npm run site:build`.

<details><summary>The strategy practice site is a workspace, but not like the others</summary>

`apps/strategy-practice` was merged in from the durer-jatekok repository with
its history, and renamed from `apps/practice` when the relay practice app
arrived (pre-rename history: `git log -- apps/practice`). Its vite config binds
all interfaces and pins port 8012, so it forwards out of the dev container with
no extra setup and does not collide with the 5173 the other frontends share.

`npm ci`, `npm run lint`, `npm run build`, `npm run typecheck` and `npm test` at
the root cover it — the lint as one more workspace turbo runs eslint in, under its
own config, the tests through its own vite config, which the root
`vitest.config.mts` lists as a second project;
[`apps/strategy-practice/AGENTS.md`](apps/strategy-practice/AGENTS.md) § *How
this app sits in the monorepo* has the why. Its suite alone is
`npm test --workspace=strategy-practice`, from anywhere.

**Do not run `npm ci` from `apps/strategy-practice`.** There is one lockfile, at
the root; from a workspace directory npm installs that workspace's subtree and
leaves the root's own dependencies unmet, while exiting 0.
[`apps/strategy-practice/AGENTS.md`](apps/strategy-practice/AGENTS.md) is the
authority on everything under that directory.
</details>

## The checks CI runs

```bash
npm run lint          # also the formatter — `npm run lint:fix` applies it
npm run typecheck
npm test
npm run build
npm run i18n:check
npm run spell-check
npm run stack:build   # needs docker; the other six do not
```

`npm run check` runs the six that need no docker, in one command and cheapest
first, so a misspelt word costs seconds rather than the two or three minutes the
whole set takes. It is what to run before pushing; `stack:build` is separate because it
needs docker.

<details><summary>Why formatting is ESLint's, and what it deliberately leaves alone</summary>

Every workspace carries `lint` and `lint:fix`, which is what turbo runs; to lint
one while you work in it, `npm run lint --workspace=<name>` is that one process,
and `npx eslint .` from its directory is the same subtree under whichever config
governs it. `eslint.stylistic.mjs` holds the character-level rules both configs import —
spacing, blank lines, final newlines — while the rules that decide where a line
*breaks* stay per-workspace. `npm run lint:fix` applies them, and
`.vscode/settings.json` runs the same fixes on save. They are `@stylistic` rules
because eslint core's formatting rules are deprecated and frozen. The shared set
excludes anything that moves code between lines: layout here is often
deliberate, and a formatter that re-prints from the AST cannot tell a grid from
an accident. `.editorconfig` covers indentation for new code, and quote style is
enforced only where the code already agrees on one — that module says which, and
why the rest is left alone.
</details>

<details><summary>What the spell check covers, and where its vocabulary lives</summary>

`npm run spell-check` checks English and Hungarian alike (via
`@cspell/dict-hu-hu`, with both British and American spellings accepted), past
competition problem text included — the same config the VS Code Code Spell
Checker extension reads. It covers every source file in the repository —
TypeScript, `.js`/`.mjs`/`.cjs`, Python and markdown — along with the
translation JSONs, the files under dot directories included: hence the three
globs in the script over one shared extension list, since `**/*` alone skips
`.github/` and friends. The data files are ignored outright in `cspell.json`:
`teamData.ts` for its arbitrary team names and `scripts/test.tsv` for the same
reason.

Vocabulary the dictionaries lack lives in three places: technical identifiers in
`cspell.json`'s `words` list; the competition's own coinages and proper nouns in
`cspell/hungarian-words.txt` (hand-curated, small); and the everyday agglutinated forms
`@cspell/dict-hu-hu` misses in `cspell/hungarian-hunspell-words.txt`, which no one
maintains by hand — `npm run spell-check:hu-triage` regenerates it from the same
globs, validating every word against real hunspell (needs
`apt install hunspell hunspell-hu`) and printing whatever hunspell rejects for a
human to fix or bless.
</details>

## Dependency updates

[`docs/DEPENDENCIES.md`](docs/DEPENDENCIES.md) is the authority: why pins are exact, what a
report row means, and the majors held back deliberately.

# Configuration you may want to change

`npm run setup` creates each of these from its committed `*.sample` twin, and
never overwrites one that already exists. The sample values run the stack locally
and are meaningless anywhere else. Whatever reads one takes the change at start:
vite does not pick up `.env` edits, and the docker stack reads `.env.docker` at
`up`.

| file | what reads it |
| --- | --- |
| `.env.docker` | the docker stack — bot and admin credentials, the postgres password |
| `apps/online-backend/.env` | the same settings for `npm run dev:server`, plus `DATABASE_URL` — which is all `teams:import:local` reads |
| `apps/online-frontend/.env` | `VITE_SENTRY_DSN` for the competition site |
| `apps/offline-frontend/.env` | the same for the dry run, plus the S3 bucket its play data goes to |
| `apps/relay-practise-frontend/.env` | the same, for the relay practice site |

Because setup never overwrites, a file you already have goes stale when its
sample gains a setting — so setup, and each `dev:*` script that runs it first,
names any setting the sample has that yours lacks.

<details><summary>Why it compares key names only, and what is not in the table</summary>

Your credentials and `DATABASE_URL` are *meant* to differ from the sample, so a
value diff would be noise on every run, and a check that never reads a value
cannot print one.

The accent colour and the interface language are deliberately not env vars: every
build of an app uses the same two values, so they are constants at the top of its
`src/App.tsx`. As env vars they were a gitignored copy of the sample, and a change
to the sample reached only whoever happened to delete their `.env` and re-run
`npm run setup` (#443).
</details>

## Error reporting

Each frontend sends errors and pageload traces to Sentry only when its `.env`
sets `VITE_SENTRY_DSN`. Without one the SDK is never initialised, so a build with
nowhere to report to makes no requests rather than failing them.
`pages-deploy.yml` passes the repository variable `SENTRY_DSN` to the builds,
which is how `/valto/` and `/proba-verseny/` would get theirs — there is no
`.env` in CI to read.

The backend reports separately, to its own project, from a DSN still written
into `apps/online-backend/src/server.ts` — its failures reach the server log, not
a competitor's browser.

<details><summary>Why the gate exists, and why no DSN is set</summary>

It replaced a DSN hardcoded in all three entry points, pointing at a project
`sentry.durerinfo.hu` answers `400` for: every visitor of the public practice
sites got that failed POST in the console on load, and no report ever arrived.
Issuing a DSN that works is a change on the Sentry server rather than in this
repository; set it here once there is one.
</details>

# Competition secrecy

A new competition's game must stay secret until after the competition, which is
why each year has a private synced repo.


When the year's repo is created:

- **Set the two secrets**, on the *public* repository, which is where `sync.yml`
  runs: `PRIVATE_REPO_NAME` is the mirror's `owner/repo`, and `PRIVATE_PAT` is a
  fine-grained token scoped to that one repository with **Contents: Read and write** and Workflows permissions.
- **Decide about Actions.**: Actions minutes are metered on a private repository

The sync workflow can be used locally with:

```bash
SYNC_SOURCE=/tmp/public.git SYNC_TARGET=/tmp/private.git REF=sync-test \
  node scripts/sync-mirror.mjs
```

# Debugging

`npm run dev:server` starts the backend with `--inspect`, so with it running the
`Attach to Backend` configuration in `.vscode/launch.json` attaches on port 9229
and breakpoints in `apps/online-backend/src` hold — it restarts the attachment
when tsdown rebuilds. The frontend is debugged in the browser's devtools, where
Vite's source maps show the original files. The `Debug Frontend` launch
configuration predates Vite (port 3000, webpack source-map paths) and does not
work until someone updates it.

# Creating a new game

This is a game for the **live competition** (boardgame.io). A game for the
strategy practice site is a different shape entirely — see
[`apps/strategy-practice/README.md`](apps/strategy-practice/README.md#adding-a-new-game),
and the `new-game` skill under that directory is the route.
[`AGENTS.md`](AGENTS.md) § *Creating a New Game* holds the rules that keep it
safe: why the bot must not reach the served bundle, and the by-hand check for
that before a competition.

1. One self-contained folder in `packages/game/src/games/strategy/<game-name>/`
   — `stones/` and `19ocd/` are the live examples:

   - `game.ts` — the boardgame.io game definition
   - `strategy.ts` — the server bot, plus any lookup tables it imports
   - `board.tsx` — the React component for the game board
   - `main.tsx` — the game description shown to players

   No `index.ts` barrel: the three files are registered separately, below, and a
   barrel re-exporting the bot next to the board would undo that. More files are
   fine — `stones/` keeps its `moveMap.ts` beside the bot — but what the bot and
   the board *both* need goes in `game.ts`. A helper beside them is a file the
   bot entry and the client entry have in common, which the walk below reads as
   the bot reaching the served bundle, and fails.

2. Register it in the three registries under
   `packages/game/src/games/strategy/`, one per package entry:
   `strategy-games.ts` (the game definition and its name — the `game` entry),
   `strategy-bots.ts` (`game/bot`) and `strategy-client.ts` (`game/client`).
   `apps/online-backend/src/server.ts` imports `game` and `game/bot`; the live
   client `game` and `game/client`; the offline dry run all three.

What each file provides — the names are the ones the registries import. The
game's shape is typed as `GameType` in `packages/game/src/common/types.ts`, and
`gameWrapper` (`gamewrapper.ts`) adds everything the files below do not mention:
the clock, the test/live choice, choosing who starts, tries and score.

- **`game.ts`** exports `MyGameWrapper(category)`, returning
  - `name`, equal to the category's entry in `strategyNames`
    (`strategy-games.ts`); the server and the clients use that entry, so
    nothing catches a mismatch
  - `setup`, the game's own half of `G` only
  - `moves`: a move sets `G.winner` when it decides a sub-game and ends with
    `events.endTurn()`. Each live game also scores the sub-game in its move
    (#459)
  - `possibleMoves`, every legal move, from which the bot picks at random
  - optionally `turn`, which the live games use for the end-of-time checks
    (#594)

  A move takes as many arguments as you give it: `moves.changeCoins(K, L)` for
  a "pick two values, then commit" turn.
- **`strategy.ts`** exports `strategyWrapper(category)`, returning
  `(state, botID) => [args, moveName]`. In the `startNewGame` phase it answers
  with `setStartingPosition` and the opening position — the bot is the only
  source of it in both live games. `GameType.startingPosition` is typed but
  `gameWrapper` never calls it (#35), so do not use it. `[undefined, moveName]`
  makes the bot play a random move from `possibleMoves`.
- **`board.tsx`** exports `MyBoard`, which takes boardgame.io's `BoardProps` and
  draws the board alone. The countdown, the test/live and role buttons, the
  status line and the end table come from `boardWrapper`
  (`packages/common-frontend/src/common/boardwrapper.tsx`).
- **`main.tsx`** exports `description<Category>`, the rules text shown above the
  board, one per category the game is played in.

A relay is not a new game but a problem list: `Problem[]` per category in
`packages/relay-bot/src/games/relay/strategy.ts` for the competition, and per
problem set in `apps/relay-practise-frontend/src/problems.ts` for the relay
practice site. The same secrecy applies to an unreleased problem set as to a
game.
