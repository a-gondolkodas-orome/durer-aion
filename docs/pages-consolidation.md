# GitHub Pages consolidation

How the practice sites move onto one GitHub Pages site, and who has to do
what. Written up on its own because it needs DNS changes and edits to
durerinfo.hu that live outside this repo.

Status: **live on the default domain** — steps 0–3 are done. All four pages
serve from `a-gondolkodas-orome.github.io/durer-aion/`, built from `main` by
`.github/workflows/pages-deploy.yml`. What remains is the custom domain and
the `jatek.durerinfo.hu` cutover, which start with a DNS record outside this
repo. `jatek.durerinfo.hu` is unaffected so far.

## Why this is needed at all

**A repository serves exactly one GitHub Pages site**: one build source
(a branch *or* Actions) and one custom domain. There is no such thing as two
custom domains, or two independent sites, in one repo.

durer-aion's single slot is already taken, by the `gh-pages` branch. Once
`apps/strategy-practice` deploys from here too, and #224 adds a relay practice app,
three things want that one slot. They can share it — as subpaths of one
artifact — but only if we lay them out deliberately, which is what this
document decides.

## The four sites

| what | where it is today | notes |
| --- | --- | --- |
| **Strategy game practice** | `jatek.durerinfo.hu` (durer-jatekok, Pages from Actions) | The live practice site. Hash-routed, so every deep link is `#/game/…`. |
| **Relay practice** | `https://a-gondolkodas-orome.github.io/durer-aion/` (durer-aion `gh-pages` branch) | Live: pick a past year's problem set, 90 minutes. A Create React App build from **August 2023** whose source no longer exists — see below. #224 is building its replacement as `apps/relay-practise-frontend`. |
| **Competition dry run** | no permanent home — built per competition and deployed from that year's private repo | `apps/offline-frontend`: the full competition shell, both rounds, in-browser bots. Also uploads play data to S3 (see below). |
| **The real competition** | `verseny.durerinfo.hu` | nginx + docker, **not** GitHub Pages. Unaffected by any of this. |

### About the competition dry run

`apps/offline-frontend` mounts the same `Main` shell the live site uses, with
`RelayClient` and `StrategyClient`, an `OfflineClientRepository` and in-browser
bots — so it is a dry run of *both* rounds, not a game demo.

It also posts every start/step/end — including `G`, `ctx` and the full match
log — to an S3 bucket keyed by join code and timestamp
(`VITE_S3_BUCKET_NAME` / `VITE_S3_FOLDER`). Two consequences:

- Anyone who has the URL can write to that bucket, which is why its address has
  always been obscure. `/proba-verseny/` stays off the home page for the same
  reason.
- `sendData` used to **throw** when those vars are unset, which would have made
  them a hard prerequisite for `/proba-verseny/`. They are not, and it no
  longer does: an unconfigured build warns once on the console and skips the
  upload, so the practice deploy ships without a bucket while the
  per-competition deploy from the year's private repo keeps sending exactly as
  it does today.

Note that `apps/offline-frontend`'s `predeploy` carries
`PUBLIC_URL=/durer19o-xn7ElDP7nQm2M1`, which is **not** a URL this site has to
preserve. Per `DEPLOYMENT.md` that value is a *repository name*, set locally at
deploy time for one competition and explicitly not meant to be committed. It
gets replaced by the `/proba-verseny/` base, and giving the dry run a permanent
home here is new — it has never had one.

### The live relay practice site cannot be rebuilt

Nothing on `main` builds it. Its source went away in the monorepo restructure
(#138) — `SelectRound` and `LoginToRelay` exist only in #224 — so what is
serving today is an orphaned artifact on the `gh-pages` branch. #224's copy is
a direct descendant of its wording, which is how we know the lineage.

**This is a sequencing constraint, not a footnote.** A repository serves one
Pages source at a time, so the moment durer-aion's source switches from the
`gh-pages` branch to Actions, relay practice goes offline — and cannot come
back until #224 lands.

**Decided: preserve the 2023 build — done.** It is committed at
`pages/valto-2023/`, and `scripts/rebase-static-site.mjs` rewrites the
`/durer-aion/` baked into it to whatever prefix the deploy serves it from.
`/valto/` therefore serves the existing relay practice from the first deploy,
and #224 replaces the directory wholesale when it merges.

The snapshot is a committed build output, which is ugly and worth saying out
loud — but the alternative, a workflow step that reads the `gh-pages` branch,
hides a dependency on a branch we intend to delete. Rejected alternatives:
landing #224 before the cutover puts a 48-file contributor PR, currently
conflicted, on the critical path of the deploy move; accepting an outage costs
users a working site for no engineering gain.

Two things found while doing it:

- **The 2023 source is not lost after all.** The bundle's source map carries
  `sourcesContent` for all 830 modules, including the 106 original app sources
  (`pages/GithubPagesMain.tsx`, `client/relay-rounds.ts`,
  `games/relay/problems.ts`, …). That settles the open question below: deleting
  the `gh-pages` branch is only safe *because* the artifact — map included — is
  committed here.
- **This build ignores the hash route.** Every `#/…` path renders the same page,
  so unlike durer-jatekok's `#/game/…` links there are no relay deep links to
  preserve. Verified by serving the original and the rebased copy side by side
  and diffing the rendered text on four routes: identical, no failed requests.

## Target layout

One Pages site on durer-aion, **one home page and three subpages**, all in one
artifact built by one workflow. Shown at the end state; until the custom domain
is added everything sits under the `/durer-aion/` project prefix instead (see
Sequence).

```
gyakorlo.durerinfo.hu/
  /                 home page — what this site is, and where to go
  /jatekok/         apps/strategy-practice        strategy game practice
                                                  (today's jatek.durerinfo.hu)
  /valto/           the frozen 2023 relay practice build, rebased from
                    /durer-aion/; replaced by apps/relay-practise-frontend (#224)
  /proba-verseny/   apps/offline-frontend         competition dry run, both rounds
```

`jatek.durerinfo.hu` stays on the durer-jatekok repo and becomes a redirect
into `/jatekok/`.

### The home page

From the first deploy the site root serves something or visitors get a bare
404. A ten-line static `index.html` is enough to start with; a designed one can
follow. It also answers the "I landed on the wrong subpage" problem — the site
holds several different things now, and the root is where that becomes visible.

**It should link the two practice sites, and not `/proba-verseny/`.** The dry
run uploads play data to a shared S3 bucket (below), so it is meant to be
handed to testers rather than discovered — the same reason its address has
always been obscure. It stays reachable by anyone who has the link.

## The redirect, and why GitHub does not give it to us

GitHub automatically redirects a repo's **default** `*.github.io` URL to its
configured custom domain — that is the redirect that already carries
`#/game/PileSplitter` from `github.io/durer-jatekok` to `jatek.durerinfo.hu`.

It does **not** redirect one custom domain to another. Once a repo's CNAME
says `gyakorlo`, a request for `jatek.durerinfo.hu` arrives with a Host that
Pages does not recognise and gets a 404.

So `jatek → gyakorlo` has to be built. The cheapest way needs no DNS change and
no new infrastructure: **leave `jatek.durerinfo.hu` on durer-jatekok** and
replace that repo's published content with a redirect stub.

```html
<script>
  // location.hash is the point: fragments never reach the server, so the
  // preservation has to happen in the browser. Every deep link on the
  // practice site is a fragment, so this one line covers all of them.
  location.replace('https://gyakorlo.durerinfo.hu/jatekok/' + location.hash);
</script>
```

**To verify before Phase 7**: whether an *archived* repository keeps serving
Pages. If it does not, durer-jatekok stays un-archived with a README banner
instead of being archived.

## Analytics: what the move does to umami

The practice site is tracked by self-hosted umami at `umami.durerinfo.hu`,
loaded from `apps/strategy-practice/index.html`. Two halves, and only one of them is a
problem.

**The URL space is safe.** `usePageviewTracking` reports
`location.pathname + location.search` from react-router, which under a hash
router is the path *inside* the hash (`/game/ChessRook`). It never includes the
site's base, so serving the app at `/jatekok/` changes nothing about what umami
records — history stays comparable across the move, and no report breaks.

**The domain allow-list is not.** The script tag carries

```html
data-domains="jatek.durerinfo.hu"
```

and umami no-ops off the listed hostnames — the code comments say as much
("off the production domain, which is left untracked"). So on
`gyakorlo.durerinfo.hu` **tracking stops silently**: no error, no warning, just
no data, which is the kind of failure nobody notices for a month.

Two consequences for the sequence:

- The attribute takes a comma-separated list, so it should name every host the
  site is served from during the transition:
  `jatek.durerinfo.hu,a-gondolkodas-orome.github.io,gyakorlo.durerinfo.hu`.
  That keeps the github.io staging deploy tracked too, and it can be trimmed to
  the final domain after the cutover.
- Worth checking the website's own domain field in the umami dashboard at the
  same time, which lives outside this repo.

The repo merge itself changed nothing here: the site is still deployed from
durer-jatekok, at the same domain, with the same script tag.

## Sequence

**The custom domain is not a prerequisite.** The whole site can be built,
deployed and verified on durer-aion's default Pages URL first, which takes the
DNS record off the critical path — nobody outside the repo is needed until the
very end.

On the default domain the site lives under the project prefix:

```
a-gondolkodas-orome.github.io/durer-aion/                 home page
a-gondolkodas-orome.github.io/durer-aion/jatekok/         strategy game practice
a-gondolkodas-orome.github.io/durer-aion/valto/           relay practice
a-gondolkodas-orome.github.io/durer-aion/proba-verseny/   competition dry run
```

and adding the custom domain later moves it to `gyakorlo.durerinfo.hu/jatekok/`
and so on. **Interim links survive that move**: GitHub redirects the default
domain to the custom one with the project prefix stripped and the rest of the
path kept, which is the same behaviour already verified for
`github.io/durer-jatekok` → `jatek.durerinfo.hu`.

| # | who | what |
| --- | --- | --- |
| 0 | dev | **Done.** Groundwork with no effect on any deploy: practice's two non-deploy workflows ported to the repo root with `paths` filters, and every script that reads the repo's layout taught the new one |
| 1 | dev | **Done.** `test-and-deploy` replaced by a root workflow that builds the three subpages into one artifact; static home page; `data-domains` extended |
| 2 | maintainer | **Done.** Settings → Pages: source = GitHub Actions, no custom domain. See the note below — the first deploy went live before the setting was changed |
| 3 | everyone | **Done.** All four pages verified live on the github.io URL. `jatek.durerinfo.hu` is still served by durer-jatekok, untouched |
| 4 | teammate | **Done.** DNS record for `gyakorlo.durerinfo.hu` → durer-aion's Pages |
| 5 | dev + maintainer | **← next.** `pages/home/CNAME` (which is the artifact root, so no `public/` is involved) and `SITE_ROOT: /`, in one PR because neither half works alone; then confirm the custom domain in Settings |
| 6 | maintainer | Cut over: replace durer-jatekok's published content with the redirect stub |
| 7 | **teammate** | Repoint the links on durerinfo.hu |
| 8 | dev | Later, in any order: #224's relay app replacing the frozen `/valto/`, the designed home page |

Steps 1–5 have no effect on `jatek.durerinfo.hu`. Step 6 is the only
irreversible-feeling moment, and it is a one-file revert.

**Why step 5 is one PR and not two.** The base path and the domain have to move
together: a `/durer-aion/`-based build served from the domain root asks for
assets nobody serves, and a `/`-based build on the default domain does the same.
There is no ordering that avoids a broken window, so the two land in one merge —
and since the deploy workflow going green *is* the cutover (below), that merge is
the moment the site changes address.

**What actually happened at step 2, because it is worth knowing next time.**
The switch was not the trigger. The first `pages-deploy` run on `main` created
a Pages deployment through the API, and GitHub published it — `updating_pages`
→ success, the site serving the new artifact — while Settings still read
"Deploy from a branch". So a repository whose Pages source is a branch will
still serve an Actions artifact once a workflow deploys one, and the *setting*
is what gets reconciled, not the deploy that gets rejected. The setting was
then changed explicitly, which is still worth doing: leaving it on the branch
keeps `gh-pages` as a competing source.

Practical consequence: **the deploy workflow going green is itself the
cutover.** There is no separate moment to hold, and no arrangement where the
artifact sits staged while someone decides.

One thing does change visibly at step 2: `github.io/durer-aion/` stops being
the 2023 relay practice and becomes the new home page, with relay practice one
click away at `/durer-aion/valto/`. That is the intended end state arriving
early rather than a regression — and it is why the frozen relay build ships in
the very first deploy rather than later.

## What moving a workflow out of its app broke (step 0)

GitHub only reads `.github/workflows/` at the repository root, so practice's
workflows have to leave the directory their scripts resolve paths from. Three
things depended on that and **none of them failed loudly**, which is the
argument for doing this move in its own PR rather than inside the deploy switch:

- `check-versions.mjs` reads the workflows to compare their `image: node:` pins
  against `.nvmrc`. It gates `npm test` and both workflows, so this one at least
  breaks visibly — with `ENOENT`, not with an explanation.
- `dependency-report.mjs` *lists* `.github/workflows/`, so it would have
  reported no action pins at all — a monthly report quietly going half blank.
  It now scans the root directory, which made the action rows the whole
  monorepo's while the npm and Node rows stayed practice's — the rest followed
  in #319.
- `patch-coverage.mjs` diffs against the merge base and matches `src/…` paths
  against lcov. Run from a subdirectory git prints `apps/strategy-practice/src/…`, which
  matches nothing, so the job would have passed **every** PR with "nothing to
  measure" — a coverage gate that reports success while measuring zero lines.
  `git diff --relative` restores both the paths and the scoping.

Two more the move introduces rather than breaks: the `OPS` label the report
issue carries did not exist in this repo, and `gh issue create` fails outright
on an unknown label — created by hand rather than by the workflow, since a
label is repository state, not something a monthly job should reassert; and the
issue title now names the app, since this repo holds four.

## Code changes step 1 needs

- [x] **A parameterised base path** — done. Both vite apps read `SITE_BASE`
  and fall back to what they serve today, so nothing changes until a deploy
  sets it. The prefix differs before and after the custom domain
  (`/durer-aion/jatekok/` vs `/jatekok/`), so the workflow composes all three
  subpaths from one variable and step 5 edits one line rather than one per app.
  Not `VITE_`-prefixed on purpose: vite would embed it in the client bundle,
  and it is a build input, not application config.

  **`SITE_BASE` has to be in `turbo.json`'s `globalEnv`.** Turborepo 2 runs
  strict env mode and passes through nothing it was not told about, so without
  the entry the variable reaches turbo and not vite — and the build succeeds,
  quietly falling back to `/`. The site would then deploy with root-absolute
  asset paths and 404 every file under the subpath. Same trap as
  `DEV_SERVER_HOST` in the dev container; verified by removing the entry and
  watching the paths lose their prefix.
- [x] **The `CNAME` file** — done, by deletion. `apps/practice/public/CNAME`
  already existed and said `jatek.durerinfo.hu`: harmless in durer-jatekok,
  where practice *is* the site, and wrong here, where it would be copied into
  `/jatekok/CNAME`. At the artifact **root** it would be worse than wrong — it
  would tell this repo's Pages its domain is `jatek.durerinfo.hu`, the one
  domain that must keep pointing at durer-jatekok. Deleted, and the deploy
  asserts no `CNAME` reappears. The real one goes in at **step 5**, at the root
  of the assembled site rather than inside an app.
- [x] **A root workflow** — done. `pages-deploy.yml` builds each app against its
  own subpath, rebases the frozen relay artifact, assembles one `site/` tree and
  runs `upload-pages-artifact` + `deploy-pages` once. It carries practice's
  `check:versions` / lint / typecheck / test gates, which `pr-test` only runs on
  pull requests — without them a push to `main` would deploy checks nobody ran.
- Practice's workflows keep their own conventions (`checkout@v7`, `cache@v6`,
  containerised `node:24.11.1`) rather than being harmonised with durer-aion's
  `setup-node` + `.nvmrc` jobs; converging them is separate work.

**One coupling this introduces**: one artifact means one upload, so a build
failure in any app blocks the deploy of all of them. Acceptable — they share a
repo and a CI run — but it is a change from today, where the sites deploy
independently.

## Decided: Hungarian names

**Domain: `gyakorlo.durerinfo.hu`. Paths: `/jatekok/`, `/valto/`,
`/proba-verseny/`.** One canonical language throughout, with English reachable
in one click from every page. The reasoning below is kept because it is the
argument for *one* canonical name rather than two, which still governs any
later request for an English alias.

## One domain or two, and in which language

Both sites already serve Hungarian and English and let the visitor switch
in-app — durer-aion through i18next (`supportedLngs: ['en', 'hu']`,
`fallbackLng: 'hu'`), practice through its own `LanguageProvider` and
`LanguageSelector`. **The address selects nothing.** Whatever domain or path
someone arrives through, they get the language they choose, so a bilingual URL
scheme buys recognisability at the door and no functionality at all.

That makes duplicated content a bad trade: two paths, or two domains, serving
the same build doubles the URL surface for a cosmetic gain, and whichever one a
person happens to copy is the one that spreads. Ranked:

1. **One canonical domain, bilingual home page.** The home page is being built
   anyway and is the natural signpost — it can greet in both languages and
   label each subpage in both. An international visitor who cannot parse
   *gyakorlo* still lands somewhere immediately legible.
2. **Plus an alias that redirects**, if the second name is worth it. This must
   be a **301 at the DNS/CDN layer**, not a second Pages custom domain: a repo
   has exactly one, and a hostname merely pointed at Pages without being *the*
   configured domain gets a 404. Strictly additive, keeps one real URL, and
   depends on whether durerinfo.hu's DNS provider supports redirect rules.
3. **Two real sites** — only possible with a second repository, and it means
   maintaining two deploys of one artifact. Not worth it for a signpost.

The same reasoning applies to paths: if both languages feel necessary, make one
canonical and let the other be a redirect stub, rather than serving the same
build at two addresses.

## Decisions taken

- **Domain**: `gyakorlo.durerinfo.hu`. An English alias stays possible later as
  a DNS-level 301, never as a second Pages domain.
- **Paths**: Hungarian throughout — `/jatekok/`, `/valto/`, `/proba-verseny/`.
- **Relay continuity**: carry the 2023 build forward, rebased to `/valto/`,
  until #224 replaces it.

## Open questions

1. **What happens to the 2023 `gh-pages` branch.** Both preconditions for
   deleting it now hold: the Pages source is Actions, and the artifact is
   committed here — source map and all — so the branch holds nothing that is
   not also on `main`. It is now inert either way, and the only reason left to
   keep it is as a rollback that needs no rebuild. Reasonable to delete once
   `/valto/` has served real traffic for a while; no rush, and nothing depends
   on the timing.

## Action items to decide on later

Deliberately deferred, so they do not block the consolidation.

- [x] **Make `sendData` optional** — done: it returns instead of throwing when
  `VITE_S3_BUCKET_NAME` / `VITE_S3_FOLDER` are unset, so `/proba-verseny/` can
  deploy without a bucket.
- [ ] **Decide whether the practice dry run should upload at all.** durer-jatekok
  now has umami, which covers the "how is it being used" question that the S3
  dump used to answer, for a fraction of the data and none of the
  anyone-can-write exposure. If umami is enough here, the S3 path can go from
  the practice deploy entirely and stay only in the per-competition build —
  and then `/proba-verseny/` need not stay off the home page either.
- [ ] **Clean up `PUBLIC_URL=/durer19o-xn7ElDP7nQm2M1`** from
  `apps/offline-frontend/package.json`. A committed per-competition value that
  `DEPLOYMENT.md` says should never have been committed.
- [ ] **Consider umami for the other subpages.** `/valto/` and `/proba-verseny/`
  have no tracking today. Not required, but the one-line script tag is the
  cheapest moment to add it while the pages are being assembled anyway.
- [x] **`/proba-verseny/` renders nothing when `cdn.jsdelivr.net` is
  unreachable.** Its `index.html` pulls `latex.js` from the CDN, and with that
  request blocked the page stays blank — not a degraded render, an empty one.
  Found while verifying the assembled site, and reproducible on a plain
  root-base build too, so it is the app's own single point of failure rather
  than anything the consolidation introduces. Vendoring the script or making
  the failure non-fatal would fix it. Done, the non-fatal way: the CDN is now
  reached through a caught `import()` instead of a static one. The static form
  was the whole cause — Vite bundles every module script in `index.html` into
  one entry chunk, so the app's own bootstrap sat behind the CDN fetch and died
  with it. Both frontends carried the same snippet, so both are fixed; the
  online one is the real competition and had the same single point of failure.
  A task now falls back to its LaTeX source (`latex-js:not(:defined)` keeps the
  line breaks) rather than to nothing. Vendoring remains open as the stronger
  fix, and is now an independent choice about rendering quality offline rather
  than about whether the page comes up at all.
