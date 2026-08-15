# GitHub Pages consolidation

How the practice sites move onto one GitHub Pages site, and who has to do
what. A sub-plan of [the migration plan](./boardgame-io-replacement-plan.md)'s
PR 0.2, written up separately because it needs DNS changes and edits to
durerinfo.hu that live outside this repo.

Status: **proposed** — nothing here has been executed.

## Why this is needed at all

**A repository serves exactly one GitHub Pages site**: one build source
(a branch *or* Actions) and one custom domain. There is no such thing as two
custom domains, or two independent sites, in one repo.

durer-aion's single slot is already taken, by the `gh-pages` branch. Once
`apps/practice` deploys from here too, and #224 adds a relay practice app,
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
- `sendData` currently **throws** when those vars are unset, which would make
  them a hard prerequisite for `/proba-verseny/`. They are not: the fix is to
  make the upload a no-op when unconfigured instead of throwing, so the
  practice deploy ships without the bucket while the per-competition deploy
  from the year's private repo keeps sending exactly as it does today. That
  one-line change belongs to the PR that adds the subpage — see the action
  items.

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

**Decided: preserve the 2023 build.** The artifact hardcodes `/durer-aion/` in
14 places across `index.html`, `asset-manifest.json` and the main JS bundle;
rewriting those to `/valto/` rebases it, and it goes into the new artifact as a
frozen snapshot. `/valto/` therefore serves the existing relay practice from
the first deploy, and #224 replaces the folder wholesale when it merges.

The snapshot is a committed build output, which is ugly and worth saying out
loud — but the alternative, a workflow step that reads the `gh-pages` branch,
hides a dependency on a branch we intend to delete. Rejected alternatives:
landing #224 before the cutover puts a 48-file contributor PR, currently
conflicted, on the critical path of the deploy move; accepting an outage costs
users a working site for no engineering gain.

## Target layout

One Pages site on durer-aion, **one home page and three subpages**, all in one
artifact built by one workflow. Shown at the end state; until the custom domain
is added everything sits under the `/durer-aion/` project prefix instead (see
Sequence).

```
gyakorlo.durerinfo.hu/
  /                 home page — what this site is, and where to go
  /jatekok/         apps/practice                 strategy game practice
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
loaded from `apps/practice/index.html`. Two halves, and only one of them is a
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
| 1 | dev | PR: practice's workflows ported to the repo root with `paths` filters; Pages built from Actions; the three subpages assembled into one artifact; static home page; `data-domains` extended; `check:versions` taught its new workflow paths |
| 2 | maintainer | Settings → Pages: source = GitHub Actions. **No custom domain yet.** |
| 3 | everyone | **Verify** on the github.io URL, for as long as it takes. `jatek.durerinfo.hu` is still served by durer-jatekok, untouched. |
| 4 | **teammate** | DNS record for `gyakorlo.durerinfo.hu` → durer-aion's Pages |
| 5 | dev + maintainer | Add `public/CNAME`, rebuild with the base path switched, set the custom domain in Settings |
| 6 | maintainer | Cut over: replace durer-jatekok's published content with the redirect stub |
| 7 | **teammate** | Repoint the links on durerinfo.hu |
| 8 | dev | Later, in any order: `/proba-verseny/`, #224's relay app at `/valto/`, the designed home page |

Steps 1–5 have no effect on `jatek.durerinfo.hu`. Step 6 is the only
irreversible-feeling moment, and it is a one-file revert.

One thing does change visibly at step 2: `github.io/durer-aion/` stops being
the 2023 relay practice and becomes the new home page, with relay practice one
click away at `/durer-aion/valto/`. That is the intended end state arriving
early rather than a regression — and it is why the frozen relay build ships in
the very first deploy rather than later.

## Code changes step 1 needs

- `apps/practice/vite.config.js`: `base: '/'` → a **parameterised** base, since
  it differs before and after the custom domain — `/durer-aion/jatekok/` on the
  default domain, `/jatekok/` after. Read it from one env var set by the
  workflow so the switch at step 5 is a single line, not an edit in every app.
  The same variable rebases the frozen relay artifact and the home page's links.
- `apps/practice/public/CNAME`: added at **step 5**, not before — a CNAME file
  present while Settings has no custom domain configured is at best inert and at
  worst confusing.
- `apps/practice/scripts/check-versions.mjs`: it reads
  `.github/workflows/pr_test.yml` and `test_and_deploy.yml` relative to
  `apps/practice/`, where they will no longer be. It gates `npm test` and both
  workflows, so it breaks the moment they move.
- A root workflow that builds each app and assembles one `dist/` tree, then
  `upload-pages-artifact` + `deploy-pages` once.
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

1. **What happens to the 2023 `gh-pages` branch** once #224's relay app serves
   `/valto/`. Deleting the branch is safe after the Pages source moves to
   Actions, but the old `github.io/durer-aion/` URL then 404s unless the home
   page inherits it — which it does, since that URL redirects to the custom
   domain once one is set.

## Action items to decide on later

Deliberately deferred, so they do not block the consolidation.

- **Make `sendData` optional.** One line in `apps/offline-frontend/src/sendData.ts`:
  return instead of throwing when `VITE_S3_BUCKET_NAME` / `VITE_S3_FOLDER` are
  unset. Ships with the `/proba-verseny/` PR.
- **Decide whether the practice dry run should upload at all.** durer-jatekok
  now has umami, which covers the "how is it being used" question that the S3
  dump used to answer, for a fraction of the data and none of the
  anyone-can-write exposure. If umami is enough here, the S3 path can go from
  the practice deploy entirely and stay only in the per-competition build —
  and then `/proba-verseny/` need not stay off the home page either.
- **Clean up `PUBLIC_URL=/durer19o-xn7ElDP7nQm2M1`** from
  `apps/offline-frontend/package.json`. A committed per-competition value that
  `DEPLOYMENT.md` says should never have been committed.
- **Consider umami for the other subpages.** `/valto/` and `/proba-verseny/`
  have no tracking today. Not required, but the one-line script tag is the
  cheapest moment to add it while the pages are being assembled anyway.
