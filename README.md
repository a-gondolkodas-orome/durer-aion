# Durer Online Round framework

Real-time multiplayer framework for online math competitions with interactive games, built on top of boardgame.io.

## Demos

An offline version of the 2023 framework is available [here](https://a-gondolkodas-orome.github.io/durer-jatekok-new/)

An offline version of previous relay games is available [here](https://gyakorlo.durerinfo.hu/valto/)

Strategy games are available [here](https://gyakorlo.durerinfo.hu/jatekok/)

All demos are in Hungarian.

# Getting Started

## Requirements

- [Node.js](https://nodejs.org/) — the version in [`.nvmrc`](./.nvmrc) (Node 24), which is what CI and the Docker image run. With [nvm](https://github.com/nvm-sh/nvm) installed, `nvm use` in the repo root picks it up. Older versions may still work; `npm` will warn rather than stop you.
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
again. Detached like `stack:up`, so an ssh session dropping does not take the
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

`scripts/admin.py` is the post-competition scoring pull. Against the docker
stack set its `BASE_URL` to `http://localhost` — the backend's port 8000 is not
published, nginx proxies `/team` and `/game` — and `ADMIN_PASSWORD` to match
`.env.docker`. Against `npm run dev:server` its default `http://localhost:8000`
is right.

## The offline practice build

```bash
npm run dev:offline
```

`http://localhost:5173`, with no backend and no database: the games run against
the in-browser bot and persist to localStorage. Reload mid-game to check the
persistence.

## The public Pages site

```bash
npm run site:build   # home + /jatekok/ + /proba-verseny/ + /valto/ into site/
npm run site:serve   # on http://localhost:4321
```

`site:build` is the same script `.github/workflows/pages-deploy.yml` runs, so
this is the artifact a push to `main` would publish rather than an
approximation of it — base paths, the rebased 2023 relay build and the CNAME
assertion included. Worth a look before merging anything that touches an app on
the site, because the workflow going green *is* the cutover: there is no staging
step between it and gyakorlo.durerinfo.hu.

The one thing it cannot reproduce is the upload itself, and GitHub's own serving
behaviour around 404s. CI builds in `node:24.11.1`; to match that too, run the
same command under `docker run -v "$PWD":/w -w /w node:24.11.1 npm run site:build`.

## The practice site (`apps/strategy-practice`)

The strategy-game practice site (https://gyakorlo.durerinfo.hu) lives in
`apps/strategy-practice`, merged in from the durer-jatekok repository with its
history and renamed from `apps/practice` when the relay practice app arrived
(pre-rename history: `git log -- apps/practice`). It is a workspace, so it runs
from the root like the other frontends:

```bash
npm run dev:practice   # the practice site, on http://localhost:8012
```

Its vite config binds all interfaces and pins port 8012, so it forwards out of
the dev container with no extra setup, and does not collide with the 5173 the
other two frontends share.

`npm ci`, `npm run build` and `npm run typecheck` at the root cover it, but its
own ESLint and vitest setups mean the root's `npm run lint` and `npm test` skip
it. Its suite runs from anywhere by naming the workspace:

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
npm run lint
npm run typecheck
npm test
npm run build
npm run i18n:check
```

Those are the five jobs in `.github/workflows/ci.yml`; `apps/strategy-practice`
has its own two (`practice-test` and `patch-coverage`), which run from its
directory.
`npm run spell-check` exists but is not one of them — it reports on the
Hungarian problem text as well, so it is a thing to read, not a gate.

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
| `.env.local` | `VITE_FEEDBACK_URL`, read by `common-frontend`'s build |

Whatever reads one of them takes the change at start: vite does not pick up
`.env` edits, and the docker stack reads `.env.docker` at `up`.

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

# Debugging (TODO)
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
