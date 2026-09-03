# Durer Online Round framework

Real-time multiplayer framework for online math competitions with interactive games, built on top of boardgame.io.

## Demos

An offline version of the 2023 framework is available [here](https://a-gondolkodas-orome.github.io/durer-jatekok-new/)

An offline version of previous relay games is available [here](https://gyakorlo.durerinfo.hu/valto/)

Strategy games are available [here](https://gyakorlo.durerinfo.hu/jatekok/)

All demos are in Hungarian.

# Getting Started

## Requirements

- [Node.js](https://nodejs.org/) — the exact version in [`.nvmrc`](./.nvmrc), which every CI job, both dev containers and the Docker image run. With [nvm](https://github.com/nvm-sh/nvm) installed, `nvm use` anywhere in the repo picks it up. Another 24.x will most likely work too, but CI runs exactly this one. The same version is written down in four more files — `engines.node` in `apps/strategy-practice/package.json`, the `node` feature in both `devcontainer.json` files, and the `Dockerfile`'s `FROM` line — and `npm run check:versions --workspace=strategy-practice` fails until they all agree.
- [Docker](https://www.docker.com/), with your user in the `docker` group so the
  commands below need no `sudo` — `DEPLOYMENT.md` has the three lines that do
  it. Plain `sudo docker …` works too, but never `sudo npm run …`: that runs
  npm as root and leaves root-owned files behind in `node_modules`.

## The whole stack in four commands

```bash
npm ci
npm run setup         # creates the gitignored .env files from their samples
npm run stack:up      # builds everything, then starts nginx + backend + postgres
npm run teams:import  # loads scripts/test.tsv
```

Open `http://localhost` and log in with the join code `000-0000-000`.

`stack:up` returns once the containers are actually up, and fails if they are
not — so if it came back clean, the stack is running. It runs in the background,
so that is one terminal, not two, and closing it leaves the stack up.
`npm run stack:logs` follows the output of all three containers — Ctrl-C stops
watching, not the stack. `npm run stack:down` is what stops it.

That is the whole online round: the site teams see, the game server they play
against, and the database behind it.

| where | what |
| --- | --- |
| `http://localhost` | the competition site — team login, chooser, relay and strategy matches |
| `http://localhost/admin` | the admin pages; the browser asks for basic auth, user `admin`, password `ADMIN_CREDENTIALS` from `.env.docker` |
| `localhost:5432` | postgres, if you want to look at the data directly |

**Only one of the two flows at a time.** The stack's postgres and
`npm run db:up` both bind 5432, so `stack:up` fails while the other one holds
it. Stop the one you are not using — `npm run stack:down`, or Ctrl-C the
`db:up` terminal — before starting the other.

### In the dev container

Everything above works unchanged: the inner dockerd publishes port 80 on the
container's own interfaces, VS Code forwards it, and `http://localhost` is the
address.

Take the address from VS Code's **Ports** panel rather than typing one if you
are in a Codespace, where it is a rewritten `*.app.github.dev` URL and not
localhost at all. A port appears there only once something binds it, so an empty
panel means the stack is not running — `npm run stack:ps`, then
`npm run stack:logs`.

If something on your machine already holds port 80, or VS Code cannot bind it,
set `WEB_PORT` to move the stack: `WEB_PORT=8080 npm run stack:up`, then read
`8080` for `80` in everything above.

### When a URL shows nothing

```bash
npm run stack:ps    # which services are up
npm run stack:logs  # and why one is not
```

If `stack:up` itself fails with `network <id> does not exist`, that is docker's
own state rather than anything here — usually its daemon restarted while an
earlier stack was still around. `npm run stack:down` and retry; if it repeats,
restart docker. The `postgresdb` volume survives all of that, so imported teams
do not need loading again.

`npm run teams:import` loads `scripts/test.tsv`. Its first three teams cover the
three age categories — `000-0000-000` is a category C join code, `001-0000-000`
is D, `002-0000-000` is E — and there are a thousand more behind them.

### Editing code with the stack up

The backend reloads itself: `stack:up` adds the `docker-compose.dev.yml`
overlay, which mounts the backend and shared package sources and runs
`npm run dev:server` in the container. `npm run stack:logs` is where you see it
reload, and where a crash on your edit shows up. Routing changes and Koa hooks
are the exception, and a new backend dependency needs the image rebuilt —
`stack:up` again.

nginx serves the frontend from `apps/online-frontend/dist` on the host, so a
frontend change needs `npm run build` and a page reload. If you are mostly
working on the frontend, the route below reloads it for you.

## Running it without docker (except the database)

Everything reloads, including the frontend. Three terminals:

```bash
npm run db:up       # postgres in a throwaway container
npm run dev:server  # backend on :8000
npm run dev:online  # frontend on :5173
```

Then import the teams once, and open `http://localhost:5173`:

```bash
npm run teams:import:local
```

Here the frontend calls the backend across origins — `dev:online` sets
`VITE_SERVER_URL` and `dev:server` sets `ALLOW_CORS` — where the docker stack
puts both behind nginx on one origin. That difference is why anything touching
routing, the socket transport or the built assets wants a `stack:up` run before
you believe it.

`db:up` keeps its data inside the throwaway container, so stopping it discards
everything and the next start needs the import again. The docker stack keeps
postgres in a named volume: `npm run stack:down` preserves it, and
`npm run stack:down -- --volumes` wipes it.

## Running the production stack

What a deployed instance runs (see [`DEPLOYMENT.md`](./DEPLOYMENT.md)):

```bash
npm run stack:prod
```

The same compose file without the dev overlay, so the container runs the server
compiled into the image instead of a watcher, and code changes need the command
again. The overlay is also what publishes postgres on `localhost:5432`, so
under `stack:prod` the database is reachable only from the `backend` container.
Detached like `stack:up`, so an ssh session dropping does not take the
stack with it. Worth a run before a competition, and before merging anything that
touches the `Dockerfile`, nginx or the routes.

# Checking it works

[`docs/must-keep-working.md`](docs/must-keep-working.md) is the list of what
must not break. This is how to exercise each part of it locally. Do it against
`npm run stack:up` — that is the only setup that covers nginx, the socket
transport and the built frontend at once.

## A team playing the round

1. `http://localhost`, join code `000-0000-000`: disclaimer, then the chooser
   offers the relay and the strategy game.
2. Play the **relay** through to the end.
3. Play the **strategy** game through to the end against the server bot,
   choosing a role first.
4. Reload mid-match, in both. Resuming without loss of state is the thing that
   breaks quietly.
5. Open the same join code in a second tab mid-match: the running match must
   not fork.
6. Finish both and check the combined score on the finished screen.

Join codes `001-0000-000` and `002-0000-000` are categories D and E, which get
different games.

## Admin and operations

At `http://localhost/admin`, user `admin`, password from `.env.docker`:

- the team list, and a team's details from it — `/admin/<teamId>` opens one
  team directly;
- per-match state dump, per-match log dump, per-category stats;
- the actions on a running match: add minutes, relay reset, strategy reset,
  soft delete. Start a match as a team in another tab first, then act on it
  from here.

This is the one thing the stack is required for. The admin pages do not work
from `dev:online` on 5173: basic auth cannot ride a cross-origin request, and
the backend answers those with `Access-Control-Allow-Origin: *`, which may not
carry credentials. Through nginx it is all one origin, so the browser's password
prompt is all it takes.

Team import has two paths and both need checking: `npm run teams:import`, which
runs `scripts/import_teams.sh` inside the container, and the TSV upload on the
admin page.

`scripts/admin.py` is the post-competition scoring pull. It reads two
environment variables and holds no credential of its own:

- `DURER_ADMIN_PASSWORD` — the backend's `ADMIN_CREDENTIALS`. Unset, the script
  prompts for it; with no terminal to prompt on, it stops rather than sending an
  unauthenticated request.
- `DURER_BASE_URL` — defaults to `http://localhost:8000`, which is right against
  `npm run dev:server`. Against the docker stack set it to `http://localhost`:
  the backend's port 8000 is not published, nginx proxies `/team` and `/game`.
  Production is `https://verseny.durerinfo.hu`.

```bash
DURER_BASE_URL=http://localhost python3 scripts/admin.py   # prompts for the password
```

## The offline dry run (`/proba-verseny/`)

```bash
npm run dev:offline
```

`http://localhost:5173`, with no backend and no database: the games run against
the in-browser bot and persist to localStorage. Reload mid-game to check the
persistence. This is the dry run of the competition round — not to be confused
with the two practice sites below.

## The relay practice site (`apps/relay-practise-frontend`)

```bash
npm run dev:relay-practice
```

`http://localhost:5173`, again with no backend: the `/valto/` subpage of the
Pages site, where #224 replaced the frozen 2023 build. Pick a past year's relay
problem set and play it through against the in-browser bot, with progress in
localStorage — reload mid-round to check it resumes.

## The public Pages site

```bash
npm run site:build   # home + /jatekok/ + /proba-verseny/ + /valto/ into site/
npm run site:serve   # on http://localhost:4321
```

`site:build` is the same script `.github/workflows/pages-deploy.yml` runs, so
this is the artifact a push to `main` would publish rather than an
approximation of it — base paths and the CNAME assertion included. Worth a look before merging anything that touches an app on
the site, because the workflow going green *is* the cutover: there is no staging
step between it and gyakorlo.durerinfo.hu.

The one thing it cannot reproduce is the upload itself, and GitHub's own serving
behaviour around 404s. CI builds on the Node in `.nvmrc`, on a clean tree; to match
that too, run the same command under
`docker run -v "$PWD":/w -w /w node:$(cat .nvmrc) npm run site:build`.

## The strategy practice site (`apps/strategy-practice`)

The strategy-game practice site (https://gyakorlo.durerinfo.hu) lives in
`apps/strategy-practice`, merged in from the durer-jatekok repository with its
history and renamed from `apps/practice` when the relay practice app arrived
(pre-rename history: `git log -- apps/practice`). It is a workspace, so it runs
from the root like the other frontends:

```bash
npm run dev:strategy-practice   # the strategy practice site, on http://localhost:8012
```

Its vite config binds all interfaces and pins port 8012, so it forwards out of
the dev container with no extra setup, and does not collide with the 5173 the
other frontends share.

`npm ci`, `npm run lint`, `npm run build` and `npm run typecheck` at the root
cover it — the lint through its own config, which ESLint picks up as it walks
into the directory. Only `npm test` skips it, its vitest setup being its own;
[`CLAUDE.md`](CLAUDE.md) § Project Structure has the why. Its suite runs from anywhere by naming the workspace:

```bash
npm test --workspace=strategy-practice   # version check, lint, typecheck, unit
```

`cd apps/strategy-practice` if you are going to iterate in there — the rest of
its scripts, `coverage:patch` among them, work the same either way.

**Do not run `npm ci` from `apps/strategy-practice`.** There is one lockfile, at
the root; from a workspace directory npm installs that workspace's subtree and
leaves the root's own dependencies unmet, while exiting 0.
[`apps/strategy-practice/AGENTS.md`](apps/strategy-practice/AGENTS.md) is the
authority on everything under that directory.

## The checks CI runs

```bash
npm run lint          # also the formatter — `npm run lint:fix` applies it
npm run typecheck
npm test
npm run build
npm run i18n:check
npm run spell-check
```

Those are the six jobs in `.github/workflows/ci.yml`; `apps/strategy-practice`
has its own two (`practice-test` and `patch-coverage`), which run from its
directory.

`npm run lint` is the whole of the lint gate, `apps/strategy-practice` included:
ESLint resolves a config per directory as it walks, so that app is checked
against its own `eslint.config.js` and everything else against the root
`eslint.config.mjs`, in one pass. No workspace carries a `lint` script of its
own — to lint one package while you work in it, run `npx eslint .` from its
directory and you get exactly that subtree, under whichever config governs it.
What you see there is what CI sees.

It is the formatting gate too, so there is nothing extra for CI to run.
`eslint.stylistic.mjs` holds the character-level rules both configs import —
spacing, blank lines, final newlines — while the rules that decide where a line
*breaks* stay per-workspace. `npm run lint:fix` applies them, and
`.vscode/settings.json` runs the same fixes on save. They are `@stylistic` rules
because eslint core's formatting rules are deprecated and frozen. What the shared
set deliberately excludes is anything that moves code between lines: layout in this
repo is often deliberate, and a formatter that re-prints from the AST cannot tell a
grid from an accident. `.editorconfig` covers indentation for new code, and quote
style is enforced only where the code already agrees on one — that module says
which, and why the rest is left alone.

`npm run spell-check` checks English and Hungarian alike (via
`@cspell/dict-hu-hu`, with both British and American spellings accepted),
past competition problem text included — the same config the VS Code Code
Spell Checker extension reads. It covers the sources, the translation
JSONs and every markdown file in the repository, the ones under dot
directories included — hence the three markdown globs in the script, since
`**/*.md` alone skips `.github/` and friends. Only `teamData.ts` (arbitrary
team names) stays ignored as data. Vocabulary the dictionaries lack lives in three
places: technical identifiers in `cspell.json`'s `words` list; the
competition's own coinages and proper nouns in `hungarian-words.txt`
(hand-curated, small); and the everyday agglutinated forms
`@cspell/dict-hu-hu` misses in `hungarian-hunspell-words.txt`, which no
one maintains by hand — `npm run spell-check:hu-triage` regenerates it,
validating every word against real hunspell (needs
`apt install hunspell hunspell-hu`) and printing whatever hunspell rejects
for a human to fix or bless.

## Dependency updates

Every dependency is pinned exactly, in every workspace — `save-exact` in
`.npmrc` keeps new ones that way — so `package.json` says what is installed and
nothing moves without a visible diff. A package that several workspaces share
is pinned to the same number everywhere: differing exact pins force npm to nest
a duplicate, which some packages do not survive (the typescript note in
[`apps/strategy-practice/package.json`](apps/strategy-practice/package.json));
`npm ls <package>` showing one deduped install is the check. Peer dependencies
keep ranges — they state compatibility, not an install. `package-lock.json` is
still what `npm ci` installs, and everything here that compares a version reads
it.

`npm run update:minors` is the routine sweep: it bumps every pin to the newest
release inside its major, across all workspaces at once, then prints what to
run next (`npm install`, then the usual gates). It never crosses a major.

`.github/workflows/dependency-report.yml` runs on the 1st of each month and
keeps one `OPS` issue in sync with whatever is behind: every workspace's
dependencies, every action pinned in `.github/workflows/`, each `.nvmrc`, and
the docker image each deployment runs (`DOCKER_IMAGES` in
`scripts/dependency-report.mjs` says how far each is allowed to reach, and why).
`npm run report:outdated` prints the same table on demand, and needs no install
— it asks the registry directly rather than shelling out to `npm outdated`.

A row is one *upgrade*, not one package. The same name pinned at two versions is
two rows rather than one reporting a version it is not; the `written down in`
column lists every file the bump has to touch, which is the honest measure of
how big it is.

The report opens no pull requests — upgrading stays deliberate, majors one at a
time as in
[#168](https://github.com/a-gondolkodas-orome/durer-jatekok/issues/168). Why a
report rather than dependabot or renovate: the header comment of
`scripts/dependency-report.mjs`. Two versions are written down in files no
`package.json` names — Node (§ Requirements lists where) and Playwright
([that app's README](apps/strategy-practice/README.md#project-setup) says where);
`npm run check:versions --workspace=strategy-practice` fails until they agree.

### Held back deliberately

The report keeps listing these as behind — that is it doing its job of
remembering — but in a section of their own, so the `Major` count above it is
the work actually waiting (#409). The four names below are mirrored by
`HELD_BACK` in [`scripts/dependency-report.mjs`](scripts/dependency-report.mjs),
which carries the one-line caption a table cell has room for and nothing more;
`scripts/dependency-report.test.mjs` fails when the two lists stop agreeing, so
lifting a hold means editing both. Each stays where it is until the named
blocker moves (#317):

- **`koa` 2 → 3**: the server's Koa app is constructed by boardgame.io, which
  pins `koa@^2` — the backend's own `koa` entry only has to agree with the
  instance it receives. Nothing here constructs a Koa 3 app to upgrade.
- **`@koa/router` 10 → 15**: same shape — the backend never constructs a
  router, it types `server.router`, boardgame.io's own `@koa/router@10`
  instance. v15's types do not even structurally match that object.
- **`typescript` 6.0 → 7**: `typescript-eslint` caps `typescript` at
  `<6.1.0`, and 6.0 is the highest version inside the cap. That cap is the
  only remaining blocker: every tsconfig is off the `node10` resolution 7.0
  removes (`bundler` for the Vite- and tsdown-built code, `nodenext` for the
  backend).
- **`@types/node` 24 → 26**: not a blocker but a policy — the types track the
  Node major the repo actually runs (`.nvmrc`), so they move when Node does.

Both halves of the boardgame.io situation — why its transitive advisories
cannot be fixed from here and why `npm audit fix --force` must never be run —
are in [`CLAUDE.md`](CLAUDE.md).

# Configuration you may want to change

`npm run setup` creates each of these from its committed `*.sample` twin, and
never overwrites one that already exists. The sample values run the stack
locally and are meaningless anywhere else.

| file | what reads it |
| --- | --- |
| `.env.docker` | the docker stack — bot and admin credentials, the postgres password, the competition window |
| `apps/online-backend/.env` | the same settings for `npm run dev:server`, plus `DATABASE_URL` |
| `apps/online-frontend/.env` | accent colour and language of the competition site |
| `apps/offline-frontend/.env` | the same, for the offline build |
| `apps/relay-practise-frontend/.env` | the same, for the relay practice site |
| `.env.local` | `VITE_FEEDBACK_URL`, read by `common-frontend`'s build |

Whatever reads one of them takes the change at start: vite does not pick up
`.env` edits, and the docker stack reads `.env.docker` at `up`.

## Error reporting

Each frontend sends errors and pageload traces to Sentry only when its `.env`
sets `VITE_SENTRY_DSN`. Without one the SDK is never initialised, so a build
with nowhere to report to makes no requests rather than failing them.

The gate replaced a DSN hardcoded in all three entry points, pointing at a
project `sentry.durerinfo.hu` answers `400` for. Every visitor of the public
practice sites got that failed POST in the console on load, and no report ever
arrived. Issuing a DSN that works is a change on the Sentry server rather than
in this repository; set it here once there is one.

`pages-deploy.yml` passes the repository variable `SENTRY_DSN` to the builds,
which is how `/valto/` and `/proba-verseny/` would get theirs — there is no
`.env` in CI to read.

The backend reports separately, to its own project, from a DSN still written
into `apps/online-backend/src/server.ts`. Its failures reach the server log,
not a competitor's browser.

# Competition secrecy

A new competition's game must stay secret until after the competition, which is
why each year has a private synced repo: `sync.yml` mirrors any pushed `sync-*`
branch into it, the game is developed and deployed from there, and a merge-back
PR publishes it afterwards. Nothing about an unreleased game may appear in a
public commit — including engine changes phrased around its needs.

## Setting up the year's private repo

The mirror carries `.github/workflows` along with the code, so every workflow in
this repository also lands there under that repo's own triggers. Two of them are
guarded to run only in the public repository (`pages-deploy.yml`, which would
otherwise publish the secret game to Pages on a push to `main`, and `sync.yml`,
which would otherwise mirror back). The rest are left to run, so the game gets
lint, typecheck and tests while it is being developed.

When the repo is created:

- **Turn Actions off** (Settings → Actions → Disable) unless you want those
  checks. The guards make the dangerous jobs no-ops either way; this makes the
  question moot rather than answered, and it is easier to do once now than to
  re-derive later.
- **Enable Pages**, which is what serves the testers' dry run — see
  *The dry run for testers* in [`DEPLOYMENT.md`](./DEPLOYMENT.md). That site is
  public, protected only by the repository's unguessable name.
- **Set `PUBLIC_URL`** in `apps/offline-frontend/package.json` to the new repo's
  name, so the dry run's asset paths resolve.

# Debugging
VS code gives you two options to debug the application. Both of them needs some setup first, and they can't be used at the same time.

Breakpoints work either on the server, or on the frontend, but not on both at the same time. See different debugging options for further references.

## Debugging server

If you want to debug the server then instead of running `npm run dev:server` go to `Run and Debug` menu in VSCode and select `Node.JS... -> Run Script: dev:server`

![image](https://github.com/a-gondolkodas-orome/durer-aion/assets/22480910/20fcba7b-148b-41c4-988d-83f9174708f5)


## Debugging Frontend

If you want to use the Debugger to debug frontend code, you can use the `Debug Frontend` option.
In this case, you still have to start the frontend, and the backend manually.

# How to create a new game

1) Copy 4 files (board, game, main, strategy) to a new directory in `src/games/`.
1) Add game in `index.tsx` (frontend-only code)
1) Add game in `lobby.tsx` (client-side code)
1) Add game in `server.tsx` (server-side code)
