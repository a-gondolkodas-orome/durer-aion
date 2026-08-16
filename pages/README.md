# Prebuilt pages

What the Pages deploy serves that **no app build produces** — a hand-written
page. Everything else comes from `apps/`, built by
`.github/workflows/pages-deploy.yml`, which assembles all of it into `site/`.

Nothing under a subdirectory here is documented in the subdirectory itself — the
deploy copies those trees verbatim, so a README would be published along with
them.

## `home/` — the site's front page

One file, no assets, no build step: the signpost for the subpages around it.
Its links are **relative**, so it works under `/durer-aion/` and under a custom
domain alike with nothing to rebase. It links the two practice sites and not
`/proba-verseny/`, which uploads play data to a shared bucket and is meant to be
handed to testers rather than discovered.

## The 2023 relay practice build, and where it went

`valto-2023/` used to live here: a byte-for-byte copy of what
`https://a-gondolkodas-orome.github.io/durer-aion/` served from August 2023,
committed so that `/valto/` had something to serve while its replacement was
being built. `apps/relay-practise-frontend` is that replacement, so the deploy
now compiles `/valto/` like every other subpage and the artifact is gone from
the working tree — along with `scripts/rebase-static-site.mjs`, which existed
only to rewrite the base path baked into it.

It is still reachable in git history, which matters for one reason beyond
nostalgia: its source map carries `sourcesContent` for the **106 original app
sources** of that site (`pages/GithubPagesMain.tsx`, `client/relay-rounds.ts`,
`games/relay/problems.ts`, …), the source #138 removed. To read a file out of
it:

```js
// `git show <commit-before-this-one>:pages/valto-2023/static/js/main.e884697f.js.map > /tmp/map.json`
const map = JSON.parse(fs.readFileSync('/tmp/map.json', 'utf8'));
console.log(map.sourcesContent[map.sources.indexOf('client/relay-rounds.ts')]);
```

The reasoning in full is in
[`docs/pages-consolidation.md`](../docs/pages-consolidation.md).
