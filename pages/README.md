# Prebuilt pages

What the Pages deploy serves that **no app build produces** — a hand-written page
and a frozen artifact. Everything else comes from `apps/`, built by
`.github/workflows/pages-deploy.yml`, which assembles all of it into `site/`.

Nothing under a subdirectory here is documented in the subdirectory itself — the
deploy copies those trees verbatim, so a README would be published along with
them (and, since this one names the old base path, would trip the rebase check
on the way).

## `home/` — the site's front page

One page and its favicon, no build step: the signpost for the subpages around
it. Its links are **relative**, so it works under `/durer-aion/` and under a
custom domain alike with nothing to rebase. It links the two practice sites and not
`/proba-verseny/`, which uploads play data to a shared bucket and is meant to be
handed to testers rather than discovered.

## `valto-2023/` — the 2023 relay practice build

**Build output, committed on purpose.** It is not source, and nothing in it
should be edited — it is a byte-for-byte copy of what
`https://a-gondolkodas-orome.github.io/durer-aion/` has been serving since
August 2023, taken from this repository's `gh-pages` branch.

### Why it is committed

The relay practice site cannot be rebuilt. Its source was removed from `main`
in #138, and a repository serves exactly one GitHub Pages site — so the moment
durer-aion's Pages source switches from the `gh-pages` branch to Actions, that
site goes offline and cannot come back until #224's replacement lands.

Carrying the artifact forward is what keeps it up. The Pages deploy rebases it
from `/durer-aion/` to the site's `/valto/` subpath and serves it unchanged;
#224 replaces this directory wholesale when it merges. The alternative — a
workflow step that reads the `gh-pages` branch — would hide a dependency on a
branch we intend to delete.

The reasoning in full is in
[`docs/pages-consolidation.md`](../docs/pages-consolidation.md).

### The source map is the point, not ballast

`valto-2023/static/js/main.e884697f.js.map` is 4.3 MB and carries
`sourcesContent` for all 830 modules — including the **106 original app
sources** of that site (`pages/GithubPagesMain.tsx`,
`client/components/SelectProblem.tsx`, `client/relay-rounds.ts`,
`games/relay/problems.ts`, …). That is the source #138 removed, and this map is
the only surviving copy of it. Stripping the map to save space would be the
moment it is actually lost.

To read a file out of it:

```js
const path = 'pages/valto-2023/static/js/main.e884697f.js.map';
const map = JSON.parse(fs.readFileSync(path, 'utf8'));
console.log(map.sourcesContent[map.sources.indexOf('client/relay-rounds.ts')]);
```

### What rebasing has to touch

`/durer-aion/` is baked into four files: `index.html` (three asset links),
`asset-manifest.json` (seven entries), the main bundle (webpack's
`__webpack_require__.p`, which is how the lazy chunk is fetched) and its source
map. Routing needs nothing — the app mounts a `HashRouter` with
`basename="/"`, so every deep link is a fragment and none of them reach the
server.
