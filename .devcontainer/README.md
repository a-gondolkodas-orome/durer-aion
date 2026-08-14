# Dev container

An **optional** reproducible development environment. Nothing in the repo
requires it — the setup steps in the root `README.md` keep working exactly as
before, and developers who ignore this folder lose nothing.

## Using it

Open the repo in VS Code with the
[Dev Containers extension](https://code.visualstudio.com/docs/devcontainers/containers)
and accept the "Reopen in Container" prompt, or open the repo in a GitHub
Codespace. `npm ci` runs automatically once the container is created.

## What's in it

- **Node 24**, matching the `Dockerfile` and CI.
- **Docker inside the container**, so every documented flow works unchanged
  from a terminal in here — `docker run … bitnami/postgresql` for the
  database, and `docker compose up --build` for the full stack. It installs
  Docker CE rather than Moby (`"moby": false`), because the Node 24 image is
  Debian trixie-based and Debian does not package `moby-cli` there.
- **Forwarded ports**: 5173 (vite dev servers), 8000 (online-backend),
  80 (nginx, when running docker compose), 5432 (postgres).
- **ESLint and cspell extensions**, so editor feedback matches
  `npm run lint` and `npm run spell-check`.

## What it does not do

It does not create `.env` files or import teams — those steps are per-developer
and are described in the root `README.md`. It also does not start any service:
you still run `npm run dev:offline` (or `dev:server` / `dev:online`) yourself.
