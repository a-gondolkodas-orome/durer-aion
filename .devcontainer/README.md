# Dev container

An **optional** reproducible development environment. Nothing in the repo
requires it — the setup steps in the root `README.md` keep working exactly as
before, and developers who ignore this folder lose nothing.

## Using it

Open the repo in VS Code with the
[Dev Containers extension](https://code.visualstudio.com/docs/devcontainers/containers)
and accept the "Reopen in Container" prompt, or open the repo in a GitHub
Codespace. `.devcontainer/post-create.sh` then runs `npm ci` and seeds each
app's `.env` from its `.env.sample` — only where no `.env` exists yet, so your
own values are never overwritten.

## What's in it

- **Node 24**, matching the `Dockerfile` and CI.
- **Docker inside the container**, so every documented flow works unchanged
  from a terminal in here — `docker run … bitnami/postgresql` for the
  database, and `docker compose up --build` for the full stack. It installs
  Docker CE rather than Moby (`"moby": false`), because the Node 24 image is
  Debian trixie-based and Debian does not package `moby-cli` there.
- **Labelled ports**: 5173 (vite dev servers), 8000 (online-backend),
  80 (nginx, when running docker compose), 5432 (postgres). These are labels
  only — VS Code forwards each port when something actually starts listening
  on it. They are deliberately *not* in `forwardPorts`, which forwards
  eagerly and logs `ECONNREFUSED` against ports no server has bound yet.
- **ESLint and cspell extensions**, so editor feedback matches
  `npm run lint` and `npm run spell-check`.

## What it does not do

It does not import teams, and it does not start any service: you still run
`npm run dev:offline` (or `dev:server` / `dev:online`) yourself, and the
database still comes up with the `docker run … bitnami/postgresql` command from
the root `README.md`.

The seeded `.env` files carry the sample values, which are enough to run
offline-frontend. For the online round you will want to edit
`apps/online-backend/.env` — the sample's credentials and competition window
are placeholders.
