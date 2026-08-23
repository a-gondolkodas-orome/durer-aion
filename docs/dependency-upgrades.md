# Dependency upgrades

What is behind, what it would cost to move, and why some of it is not moving.

This is the doc that owns those decisions: a `package.json` says which version
is installed, never why it is that one. The tiers below are the ordering — each
one is cheaper than the one after it, and doing them out of order makes the
later ones harder.

`apps/strategy-practice` is not covered here. It keeps its own ESLint,
TypeScript and Vite (see `CLAUDE.md`), and
`.github/workflows/practice-dependency-report.yml` already reports on them
monthly. The gap this doc exists to close is that the rest of the monorepo has
no equivalent — see *Keeping this from happening again*.

## The shape of the problem

Two things are tangled together, and separating them is most of the work.

**The audit number is mostly not a major-version problem.** A clean install
reports 59 advisories. Four criticals and a large share of the highs come from
packages nothing in this repo imports, and most of the rest from in-range
patches that were never taken. Very little of it needs a major bump.

**The dependency blocks are copy-pasted across workspaces.** `packages/game`
declares `@mui/x-data-grid`, `axios`, `swr`, `yup`, `notistack`, `urlcat`,
`react-router-dom` and the Babel CLI, and imports none of them.
`apps/online-backend` does the reverse: it imports `koa`, `@koa/router`,
`koa-body`, `@koa/cors`, `koa-basic-auth`, `koa-mount`, `bgio-postgres`,
`sequelize`, `socket.io`, `@sentry/node`, `nanoid` and `dotenv` while declaring
none of them. They resolve only because the root hoists them, and five are
boardgame.io's own transitive dependencies being imported directly.

The consequence is that bumping one package means editing five or six files,
and `npm audit` cannot tell a real exposure from a copy-paste artefact. Tier 0
fixes that, which is why it comes before any upgrade.

## Tier 0 — deleted, not upgraded

Behind by one to four majors, and dead weight. Removing them *is* the upgrade.

| Package | Was → latest | Why it went |
| --- | --- | --- |
| `web-vitals` | 2.1.4 → 6.1.1 | `reportWebVitals` used the retired v2 `getCLS`/`getFID` API, and both frontends called it with no handler — it measured nothing and reported nowhere. Source deleted with it. |
| `@babel/cli`, `@babel/node`, `@babel/plugin-transform-modules-commonjs`, `@babel/preset-typescript` | 7.2x → 8.x | No `.babelrc` or `babel.config.*` exists. Their only consumers were `build_old` and `start_old`, superseded by `tsc` and `tsx watch`. |
| `gh-pages` | 4.0.0 → 6.3.0 | Critical (prototype pollution). Pages ships from `.github/workflows/pages-deploy.yml` via `scripts/assemble-site.mjs`; nothing referenced `gh-pages` or the `deploy`/`predeploy` scripts. |
| `nodemon` | 2.0.22 → 3.1.14 | High, via `simple-update-notifier`. Only consumer was `start_old`. |
| `npm` | 11.6.0 → 12.0.2 | High, via `glob`, `tar`, `pacote`, `sigstore`. `npm` as a *dependency* of two frontends was a copy-paste accident. |
| `install` | — | The same accident, sitting next to it. |
| `@testing-library/user-event` | 13.5.0 → 14.6.6 | Zero usages in the repo. |
| `concurrently` | 9.2.1 → 10.0.5 | Critical, via `shell-quote`. Referenced by no npm script — the multi-terminal dev flow in `README.md` uses separate terminals. |

Alongside them: the `build_old`/`start_old`/`deploy`/`predeploy` scripts, the
empty `apps/practice/` left by the rename in #291, and the `eslintConfig`
(`extends: react-app`) blocks that have been inert since flat config landed.

Then every remaining package moved to the workspace that imports it. That is
what makes the later tiers one-line edits.

That move surfaced one thing worth knowing before the next removal.
`packages/game` and `packages/common-frontend` both set `target: ES6` with no
`lib` and both call `Array.prototype.at`, which is ES2022. They compiled only
because `@types/node` sat in their dependency blocks and its
`compatibility/indexable.d.ts` declares `.at()` — a Node types polyfill
standing in for a lib neither config asked for, in two packages that do not
run in Node. Both now name `["ES2022", "DOM"]`, as `packages/engine` and
`packages/games` already did. Expect more of this: a dependency nobody imports
can still be holding something up.

## Tier 1 — taken

In-range or trivially compatible. No source change beyond the ranges.

Security-relevant: `axios` → 1.19 (SSRF via `NO_PROXY` bypass; auth bypass via
prototype pollution in `validateStatus`), `vite` → 7.3.6 (path traversal in
optimized-deps `.map`, arbitrary file read over the dev-server WebSocket, three
`server.fs.deny` bypasses), `react-router-dom` → 6.30.6 (XSS via open redirect;
protocol-relative-URL open redirect — this is the in-range patch, *not* the v7
migration below), `turbo` → 2.10.11.

Majors that cost nothing here:

- **`@types/node` 16 → 24.** `engines.node` says `>=24.11.1`, `.nvmrc` says 24
  and the Dockerfile is `node:24`; v16 types on a v24 runtime was the mismatch.
  Pinned to the runtime major, deliberately — not to the newest types major.
- **`@testing-library/jest-dom` 5 → 7.** One import site, already in the bare-
  import form v6 requires.
- **`cspell` 6 → 10**, **`notistack` 2 → 3**, **`urlcat` 2 → 3**,
  **`react-syntax-highlighter` 15 → 16**. Each has a handful of call sites, all
  on the API the new major keeps.

Tiers 0 and 1 together took advisories from **59 (4 critical, 32 high) to 15
(0 critical, 5 high)**, and no source file changed except the two deletions
above. Verify with a clean `npm ci` rather than an incremental install: this
tree holds two react-router majors and two Vite majors, and which one hoists
depends on install order.

## Tier 2 — doable, needs code changes

Not done yet. Each is small in lines and non-trivial in what it touches.

- **Sentry 7 → 10.** `@sentry/tracing` no longer exists — it was folded into the
  SDK at v8 — so `new BrowserTracing()` becomes
  `Sentry.browserTracingIntegration()` in both frontends' `index.tsx`, and
  `@sentry/types` merges into the core packages. Roughly ten lines. The catch is
  that v8+ wants `Sentry.init()` to run before the modules it instruments are
  imported, and the backend inits well down `server.ts`. *"Sentry receives
  events" is a `must-keep-working.md` item: this needs a real event at
  `sentry.durerinfo.hu` from a `stack:prod` run, not a green build.*
- **`yup` 0.32 → 1.** Three schema files in `packages/common-frontend`. v1 is a
  TypeScript rewrite: optional/`required()` narrowing and `nullable()` semantics
  both changed. Small surface, but it is the validation on the competition login
  and admin forms, so it is hand-walked.
- **`i18next` 25 → 26 with `react-i18next` 16 → 17.** They move together —
  react-i18next 17 requires i18next >= 26.2. Both live only in
  `packages/common-frontend`. Re-run `npm run i18n:check`.
- **`eslint` 9 → 10.** The flat config is already flat, which was the expensive
  part. `apps/strategy-practice` runs ESLint 10 today, so the version is already
  proven in this repo.
- **`vite` 7 → 8 with `@vitejs/plugin-react` 4 → 6.** Also already proven by
  practice. Sequenced after the 7.3.6 patch above so the security fix is not
  gated on a major.

## Tier 3 — large, deliberate

- **MUI 5 → 9.** Four majors, 55 import sites across 27 files. `@mui/codemod`
  handles most of each hop; the part it will not handle is
  `common-frontend/src/client/components/Layout.tsx`, which composes a nested
  theme through a function (`outerTheme => createTheme(deepmerge(...))`) —
  exactly what the v6 theming rewrite changes. One major per PR, each hand-
  walked, so a regression is bisectable.
- **`@mui/x-data-grid` 7 → 9** is one import site but peers `@mui/material ^7.3
  || ^9`. It cannot move until MUI reaches 7.
- **`react-router-dom` 6 → 7/8.** Two bare `Link` imports; trivial as code. It
  is here because practice is on `react-router` 8 and
  `packages/engine/src/react/language.tsx` documents that the two halves cannot
  share a peer range today. The version worth landing on is 8, and choosing it
  is a decision about unifying the two frontends' stacks rather than a bump.
- **`typescript` 5.9 → 6.** Practice is on 6, the root on 5.9, latest is 7. The
  root should reach 6 before anyone considers 7.
- **`nanoid` 3 → 6.** v6 is ESM-only and `apps/online-backend` compiles to
  CommonJS. One call site — `nanoid(11)` for match IDs — but match ID format is
  live-competition state, so this is not a casual change.

## Tier 4 — blocked, and why

**boardgame.io is not behind.** 0.50.2 *is* the latest release. What it carries
is a transitive tree this repo cannot reach: `ws` through `koa-socket-2`,
`@koa/cors@3`, `engine.io`, `socket.io-parser`, `flatted`, `immer@9`, `redux@4`,
`svelte@3`. Several of the remaining highs are those.

> **Do not run `npm audit fix --force` in this repo.** Its "fix" for the `ws`
> advisory is `boardgame.io@0.22.1` — a four-year downgrade that would take the
> competition with it.

Upstream is active again (issue #277), so the route is an upstream issue about
the `koa-socket-2` and `@koa/cors` pins, not a local patch. One nuance worth
recording: the backend's own `@koa/cors` resolves to v5 and is fine; the
vulnerable v3 is nested under boardgame.io and reachable only through its
server.

`sequelize`, `socket.io`, `koa`, `@koa/router` and `koa-body` are declared by
`apps/online-backend` now, but the backend and boardgame.io share the instances
— so their versions stay whatever boardgame.io tolerates.

## Notes for whoever reads `npm outdated` next

- It reports `game`, `games`, `strategy`, `common-frontend`, `engine` and
  `schemas` as behind. They are not: those are the workspaces, correctly
  symlinked. npm is comparing them against unrelated public packages that happen
  to share the names. Harmless while they are workspaces — worth remembering if
  one is ever removed, because the public package would then install silently.
- `jsdom` is inverted: the root is on 30, `apps/strategy-practice` on 29.

## Keeping this from happening again

`apps/strategy-practice/scripts/dependency-report.mjs` already does what
producing this document did by hand — resolve installed versions from the
lockfile, ask the registry, reconcile one issue monthly, open no pull requests.
It reads only its own `package.json`. Teaching it a list of package.json paths,
and pointing `practice-dependency-report.yml` at all of them, is what would stop
the root drifting three majors behind again. That is a change to practice-owned
code under its own `AGENTS.md`, so it belongs in its own PR.
