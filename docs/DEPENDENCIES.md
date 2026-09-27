# Dependency updates

Every dependency is pinned exactly, in every workspace — `save-exact` in
`.npmrc` keeps new ones that way — so nothing moves without a visible diff. A
shared package is pinned to the same number everywhere, since differing exact
pins force npm to nest a duplicate, which some packages do not survive (the
typescript note in
[`apps/strategy-practice/package.json`](../apps/strategy-practice/package.json));
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
[`scripts/check-versions.test.mjs`](../scripts/check-versions.test.mjs) is the list
of where they are — the `.nvmrc` row's count comes from it.
</details>

## Held back deliberately

The report still lists these, in a section of their own, so the `Major` count
above it is the work actually waiting (#409). Each stays until its named blocker
moves (#317). `HELD_BACK` in
[`scripts/dependency-report.mjs`](../scripts/dependency-report.mjs) mirrors the four
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
