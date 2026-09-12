# Durer Online Round framework

Real-time multiplayer framework for online math competitions with interactive
games, built on top of boardgame.io. The public demos are the
[relay practice site](https://gyakorlo.durerinfo.hu/valto/), in Hungarian, and
the [strategy games](https://gyakorlo.durerinfo.hu/jatekok/), which offer
English as well.

# Getting Started

New here? [`CONTRIBUTING.md`](CONTRIBUTING.md) is the shorter way in: a first
change that needs no docker, the one command to run before pushing, and the
conventions a review will otherwise be the first to tell you about.

## Requirements

- [Node.js](https://nodejs.org/), the version in [`.nvmrc`](./.nvmrc) —
  `nvm use` anywhere in the repo picks it up. Another 24.x will most likely work
  too, but CI runs exactly this one. An **older** Node will not work at all:
  `devEngines` in the root `package.json` requires npm 11, which 24.x bundles
  and 22.x does not, and npm treats that as an error rather than a warning — so
  every `npm run …` fails before your command runs, complaining about the
  package manager rather than about Node.
- [Docker](https://www.docker.com/), with your user in the `docker` group so the
  commands below need no `sudo` — `DEPLOYMENT.md` has the three lines that do
  it. Plain `sudo docker …` works too, but never `sudo npm run …`: that runs npm
  as root and leaves root-owned files behind in `node_modules`.

## The whole stack in four commands

```bash
npm ci
npm run setup         # creates the gitignored .env files from their samples
npm run stack:up      # builds the site, then starts nginx + backend + postgres
npm run teams:import  # loads scripts/test.tsv
```

Coming back to a checkout you already have — switching to a branch to review it,
say — is `npm run stack:up` on its own. Every `dev:*` and `stack:*` script runs
`scripts/prepare.mjs` first, which installs and seeds only if it has to: the
install happens when the lockfile or a workspace manifest actually moved, which
most branches leave alone, and nothing happens at all otherwise. `npm run deps`
runs that check by itself, for when you want the install out of the way before
starting anything.

Open `http://localhost` and log in with the join code `000-0000-000`. That is
the whole online round: the site teams see, the game server they play against,
and the database behind it.

| where | what |
| --- | --- |
| `http://localhost` | the competition site — team login, chooser, relay and strategy matches |
| `http://localhost/admin` | the admin pages; basic auth, user `admin`, password `ADMIN_CREDENTIALS` from `.env.docker` |
| `localhost:5432` | postgres, if you want to look at the data directly |

`stack:up` returns once the containers are actually up and fails if they are
not, and it runs in the background — so that is one terminal, not two, and
closing it leaves the stack up. `npm run stack:logs` follows all three
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
proxy nobody has walked (see *Admin and operations* below). When in doubt the
paragraph above is the rule — Vite is standing in for nginx, so anything about
nginx wants the stack.

## Running the production stack

```bash
npm run stack:prod
```

What a deployed instance runs (see [`DEPLOYMENT.md`](./DEPLOYMENT.md)): the same
compose file without the dev overlay, so the container runs the server compiled
into the image instead of a watcher, code changes need the command again, and
postgres is reachable only from the `backend` container. Detached like
`stack:up`. Worth a run before a competition, and before merging anything that
touches the `Dockerfile`, nginx or the routes.

# Checking it works

This is the standing regression checklist: what the competition round, the admin
side and the public sites must keep doing through any change. Do the round
against `npm run stack:up` — the only setup that covers nginx, the socket
transport and the built frontend at once. [`CLAUDE.md`](CLAUDE.md) § What must
keep working says how the list binds a change, and which items a unit test pins.

## How much of it your change needs

The list is what must keep working, not what every change has to walk. Find the
row your change fits, and walk the sections it names:

| your change touches | walk |
| --- | --- |
| a practice site or the dry run only — `apps/strategy-practice`, `apps/relay-practise-frontend`, `apps/offline-frontend` | *The other sites*, the one you touched |
| a game's rules or bot under `packages/game` | that game in *A team playing the round* |
| the admin pages, or team import | *Admin and operations* |
| the backend, `packages/common-frontend`, nginx, routing, auth, the socket transport, the build, or a dependency | all of it |
| documentation or CI only | nothing here |

Two things do not scope down, and they are the point of the table rather than
exceptions to it. **Before a competition the whole list is walked**, whatever the
last change was — that run is what the checklist exists for. And a change that
fits no row above walks all of it: the rows are the cases someone has already
thought through, not a closed set.

## A team playing the round

1. `http://localhost`, join code `000-0000-000`: disclaimer, then the chooser
   offers the relay and the strategy game. (`001-0000-000` and `002-0000-000`
   are categories D and E, which get different games.)
2. Play the **relay** through to the end: the problems are served in turn, three
   tries each at decreasing points, on the 60-minute clock.
3. Play the **strategy** game through to the end against the server bot,
   choosing a role first: a test game, then live ones, with the winning streak
   scored and the 30-minute countdown running.
4. Reload mid-match, in both. Resuming without loss of state is the thing that
   breaks quietly. Reload in the half second after a move as well, while the
   judge is thinking: a match left on the judge's turn used to stay there (#133).
5. Open the same join code in a second tab mid-match: the running match must not
   fork, and the countdown must read the same in both tabs — the time left comes
   from the server, never from the client.
6. Finish both and check the combined score on the finished screen.
7. Log out and reload: the login form is back. The session is an HttpOnly
   cookie, so devtools show `durer_team` under Cookies while logged in and gone
   after; localStorage holds no GUID, only the `loggedIn` flag other tabs hear a
   login through.
8. `npm run build`, then grep `apps/online-frontend/dist` for a string from the
   bot's lookup tables: the served bundle must contain no bot.

<details><summary>What items 7 and 8 are guarding</summary>

The GUID does not come back in the `GET /team/me` response either: it is the
cookie's value, so a copy there would be the session in a form a script can
read. boardgame.io still gives the same GUID out as the match's player name, so
this narrows the exposure rather than ending it — issue #434. On the deployed
host the login response's `Set-Cookie` also carries `Secure`, which the backend
takes from nginx's own scheme — a proxy in front of the container's nginx would
silently lose it.

Since #429 the bots sit behind the `game/bot` entry, ESLint forbids importing it
anywhere but the server and the offline dry run, and
`packages/game/src/entries.test.ts` pins that the other two entries never reach
a bot. The grep is the final check before a competition, not the only one;
[`CLAUDE.md`](CLAUDE.md) § Creating a New Game has the layout.
</details>

## Admin and operations

At `http://localhost/admin`, user `admin`, password from `.env.docker`:

- the team list, and a team's details from it — `/admin/<teamId>` opens one team
  directly;
- per-match state dump, per-match log dump, per-category stats;
- the actions on a running match: add minutes, relay reset, strategy reset.
  Start a match as a team in another tab first, then act on it here;
- deleting one team from its details, and every team from the list. The rows
  leave the grid with no reload, and each lands in `DeletedTeams` (look at
  `localhost:5432`), where it stays when the team is imported again and
  deleted a second time.

Team import has two paths and both need checking: `npm run teams:import`, which
runs `scripts/import_teams.sh` inside the container, and the TSV upload on the
admin page. The first is its own process — `dist/import_teams.js`, which reads
`DATABASE_URL` and nothing else, so no credential has to be set for a TSV to
load (#190). It reaches that process with `docker compose exec`, so the backend
container still has to be up; `teams:import:local` runs the same code with
nothing in front of it, and imports against a server that will not boot. Two
fixtures feed those by hand, which is why no code names either:
`scripts/test.tsv` is the happy path — the file `teams:import` loads — and
`scripts/unit_test.tsv` is the one shaped for the rejections, its team names
saying what each row is for: the cells to blank so the importer generates them,
the empty row to leave in, the duplicated login code and duplicated credentials
only a real database refuses. `team_import.test.ts` mocks the filesystem, so the
upload is the only thing that exercises those.

`scripts/admin.py` is the post-competition scoring pull, holding no credential
of its own:

```bash
DURER_BASE_URL=http://localhost python3 scripts/admin.py   # prompts for the password
```

- `DURER_ADMIN_PASSWORD` — the backend's `ADMIN_CREDENTIALS`. Unset it prompts,
  and with no terminal to prompt on it stops rather than sending an
  unauthenticated request.
- `DURER_BASE_URL` — defaults to `http://localhost:8000`, right against
  `dev:server`. Against the docker stack it must be `http://localhost`: port
  8000 is not published, nginx proxies `/team` and `/game`. Production is
  `https://verseny.durerinfo.hu`.

Whether the browser's password prompt appears for the admin pages' XHRs under
the `dev:online` proxy has not been walked, so check them against `stack:up`.

## The other sites

Each runs with no backend and no database, and each persists to localStorage —
reload mid-game to check it resumes, including in the half second after a move,
while the bot is thinking.

| what | run it | notes |
| --- | --- | --- |
| the offline dry run (`/proba-verseny/`) | `npm run dev:offline` | the rehearsal of the competition round, against the in-browser bot. With `VITE_S3_*` set — the competition-year build, not this one — every strategy move also uploads a `_stratstep_` file, and its `log` is the entries the live round's admin dump serves |
| the relay practice site (`/valto/`) | `npm run dev:relay-practice` | pick a past year's problem set and play it through (#224 replaced the frozen 2023 build) |
| the strategy practice site (`/jatekok/`) | `npm run dev:strategy-practice` | on port 8012, not 5173; every game playable both against the computer and two players in one browser |

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
`vitest.config.mts` lists as a second project; [`CLAUDE.md`](CLAUDE.md) § Project
Structure has the why. Its suite alone is
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

Those are the seven jobs in `.github/workflows/ci.yml`, and they cover
`apps/strategy-practice` too — it has no workflow of its own. (Its patch-coverage
gate was retired in #431; that app's own `npm run coverage` stays, on demand —
`npm run coverage --workspace=strategy-practice`, with no root script.)

`npm run check` runs the six that need no docker, in one command and cheapest
first, so a misspelt word costs seconds rather than the two or three minutes the
whole set takes. It is what to run before pushing; `stack:build` is separate because it
needs docker, and the round itself is still walked by hand.

`npm run stack:build` builds the two images the competition is deployed from —
the backend and nginx — without starting anything, and is the one gate that
reaches the `Dockerfile`, `apps/online-frontend/nginx/Dockerfile` and
`nginx.conf`. The round itself is still walked by hand, above.

`npm run lint` is the whole of the lint and formatting gate. It runs one ESLint
process per workspace through turbo, plus `lint:root` for the files in no
workspace — `scripts/`, the root configs — and each resolves the config nearest
what it is given, so `apps/strategy-practice` is checked against its own
`eslint.config.js` and everything else against the root `eslint.config.mjs`.

It was a single `eslint .` over the repository until it stopped fitting: that
process holds a TypeScript program per `tsconfig.json` at once, each with its own
parsed copy of `lib.*.d.ts`, React and MUI, and needed 3072 MB of V8 heap where
every workspace on its own needs under 1024 MB. Node sizes its default heap at
about half of the memory it can see, so the same command passed on a 16 GB runner
and died at a 2048 MB limit on a smaller one — which is how CI first failed on a
private repository. `turbo.json` carries the reasoning, `.devcontainer/README.md`
the measurements, and `scripts/lint-coverage.test.mjs` pins that the split leaves
no file unlinted: a workspace with no `lint` script would otherwise be skipped in
silence.

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
`hungarian-words.txt` (hand-curated, small); and the everyday agglutinated forms
`@cspell/dict-hu-hu` misses in `hungarian-hunspell-words.txt`, which no one
maintains by hand — `npm run spell-check:hu-triage` regenerates it from the same
globs, validating every word against real hunspell (needs
`apt install hunspell hunspell-hu`) and printing whatever hunspell rejects for a
human to fix or bless.
</details>

## Dependency updates

Every dependency is pinned exactly, in every workspace — `save-exact` in
`.npmrc` keeps new ones that way — so nothing moves without a visible diff. A
shared package is pinned to the same number everywhere, since differing exact
pins force npm to nest a duplicate, which some packages do not survive (the
typescript note in
[`apps/strategy-practice/package.json`](apps/strategy-practice/package.json));
`npm ls <package>` showing one deduped install is the check. Peer dependencies
keep ranges: they state compatibility, not an install.

`npm run update:minors` is the routine sweep: it bumps every pin to the newest
release inside its major, across all workspaces at once, then prints what to run
next. It never crosses a major.

`.github/workflows/dependency-report.yml` runs on the 1st of each month and keeps
one `OPS` issue in sync with whatever is behind: every workspace's dependencies,
every action pinned in `.github/workflows/`, each `.nvmrc`, and the docker image
each deployment runs. `npm run report:outdated` prints the same table on demand,
and needs no install.

<details><summary>Why a report rather than dependabot, and what a row means</summary>

A row is one *upgrade*, not one package. The same name pinned at two versions is
two rows rather than one reporting a version it is not; the `written down in`
column lists every file the bump has to touch, which is the honest measure of how
big it is. `DOCKER_IMAGES` in `scripts/dependency-report.mjs` says how far each
image is allowed to reach, and the header comment of the same file says why this
is a report rather than dependabot or renovate. `package-lock.json` is still what
`npm ci` installs, and everything here that compares a version reads it.

The report opens no pull requests — upgrading stays deliberate, majors one at a
time as in
[#168](https://github.com/a-gondolkodas-orome/durer-jatekok/issues/168). Two
versions are written down in files no `package.json` names: Node and Playwright.
`npm test` fails until every copy agrees, and
[`scripts/check-versions.test.mjs`](scripts/check-versions.test.mjs) is the list
of where they are — the `.nvmrc` row's count comes from it.
</details>

### Held back deliberately

The report still lists these, in a section of their own, so the `Major` count
above it is the work actually waiting (#409). Each stays until its named blocker
moves (#317). `HELD_BACK` in
[`scripts/dependency-report.mjs`](scripts/dependency-report.mjs) mirrors the four
names, and `scripts/dependency-report.test.mjs` fails when the two lists stop
agreeing.

- **`koa` 2 → 3**: the server's Koa app is constructed by boardgame.io, which
  pins `koa@^2` — the backend's own `koa` entry only has to agree with the
  instance it receives. Nothing here constructs a Koa 3 app to upgrade.
- **`@koa/router` 10 → 15**: same shape — the backend never constructs a router,
  it types `server.router`, boardgame.io's own `@koa/router@10` instance. v15's
  types do not even structurally match that object.
- **`typescript` 6.0 → 7**: `typescript-eslint` caps `typescript` at `<6.1.0`,
  and 6.0 is the highest version inside the cap. That cap is the only remaining
  blocker: every tsconfig is off the `node10` resolution 7.0 removes.
- **`@types/node` 24 → 26**: not a blocker but a policy — the types track the
  Node major the repo actually runs (`.nvmrc`), so they move when Node does.

Both halves of the boardgame.io situation — why its transitive advisories cannot
be fixed from here and why `npm audit fix --force` must never be run — are in
[`CLAUDE.md`](CLAUDE.md).

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
| `.env.local` | `VITE_FEEDBACK_URL`, read by `common-frontend`'s build |

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
why each year has a private synced repo: `sync.yml` mirrors any pushed `sync-*`
branch into it, the game is developed and deployed from there, and a merge-back
PR publishes it afterwards as a strategy practice game. Nothing about an
unreleased game may appear in a public commit — including engine changes phrased
around its needs.

When the year's repo is created:

- **Decide about Actions.** The mirror carries `.github/workflows` too, so every
  workflow here also lands there under that repo's own triggers. Leaving them on
  is what gets lint, typecheck and tests run against the game while it is being
  developed, which is when they are worth the most; the two that would reach
  outside the repository — `pages-deploy.yml` and `sync.yml` — are already
  guarded to run only in the public one. A third, `dry-run-deploy.yml`, is
  guarded the other way and *is* meant to run here: it is the one-button deploy
  of the testers' dry run, so turning Actions off costs that button and leaves
  `npm run deploy` from a checkout. What is left to weigh is cost: Actions
  minutes are metered on a private repository where the public one runs free,
  and so is the GitHub Packages storage a private image would take should #202
  publish one from there. TBD — neither has been measured against this
  organisation's plan.
- **Enable Pages**, serving from the `gh-pages` branch — that is what the
  testers' dry run is pushed to, see *The dry run for testers* in
  [`DEPLOYMENT.md`](./DEPLOYMENT.md). That site is public, protected only by the
  repository's unguessable name, which is why the deploy ships no `CNAME`.
- **Get `dry-run-deploy.yml` onto the default branch** if you want the Run
  workflow button. GitHub lists a `workflow_dispatch` workflow only when the file
  is on the repo's default branch — `dev` here — so a sync branch has to be
  merged there before the button exists. The dispatch form then picks which
  branch gets published. Nothing else about this repo needs `main`.

# Debugging

`npm run dev:server` starts the backend with `--inspect`, so with it running the
`Attach to Backend` configuration in `.vscode/launch.json` attaches on port 9229
and breakpoints in `apps/online-backend/src` hold — it restarts the attachment
when tsdown rebuilds. The frontend is debugged in the browser's devtools, where
Vite's source maps show the original files. The `Debug Frontend` launch
configuration predates Vite (port 3000, webpack source-map paths) and does not
work until someone updates it.

# Creating a new game

A game for the live competition is one folder under
`packages/game/src/games/strategy/`; [`CLAUDE.md`](CLAUDE.md) § *Creating a New
Game* has the files it holds, where to register it, and the rule that the served
bundle must not carry the bot. A game for the strategy practice site is a
different shape entirely: see
[`apps/strategy-practice/README.md`](apps/strategy-practice/README.md#adding-a-new-game).
