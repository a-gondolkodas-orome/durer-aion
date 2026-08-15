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
back until #224 lands. Three ways out:

1. **Carry the artifact forward** (recommended default). It hardcodes
   `/durer-aion/` in 14 places across `index.html`, `asset-manifest.json` and
   the main JS bundle, so it can be rebased to `/valto/` and dropped into the
   new artifact as a frozen snapshot, replaced wholesale when #224 lands. Costs
   a committed build output — or a workflow step that reads the `gh-pages`
   branch, which trades the ugliness for a hidden dependency on a branch we
   intend to delete.
2. **Land #224 before the cutover.** Cleanest end state — `/valto/` is built
   from source, no snapshot, and the stale 2023 build is retired rather than
   preserved. It puts a 48-file contributor PR, currently conflicted, on the
   critical path of the deploy move.
3. **Accept the gap.** Only reasonable if relay practice has few enough users
   that a known outage between the cutover and #224 is acceptable — a question
   for the maintainers, not an engineering one.

## Target layout

One Pages site on durer-aion, **one home page and three subpages**, all in one
artifact built by one workflow:

```
gyakorlo.durerinfo.hu/
  /                 home page — what this site is, and where to go
  /jatekok/         apps/practice                 strategy game practice
                                                  (today's jatek.durerinfo.hu)
  /valto/           apps/relay-practise-frontend  relay practice (#224), or the
                                                  frozen 2023 build until it lands
  /proba-verseny/   apps/offline-frontend         competition dry run, both rounds
```

`jatek.durerinfo.hu` stays on the durer-jatekok repo and becomes a redirect
into `/jatekok/`.

### The home page

The moment the domain exists, `/` serves something or visitors get a bare 404.
A ten-line static `index.html` is enough for the first step; a designed one can
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

- Step 2 must update `data-domains`. During the overlap the attribute takes a
  comma-separated list, so `jatek.durerinfo.hu,gyakorlo.durerinfo.hu` keeps
  both tracked while the old domain still serves, and can be trimmed after the
  cutover.
- Worth checking the website's own domain field in the umami dashboard at the
  same time, which lives outside this repo.

The repo merge itself changed nothing here: the site is still deployed from
durer-jatekok, at the same domain, with the same script tag.

## Sequence

Ordered so that nothing user-visible changes until the new site has been
verified, and so no domain is ever moved between repos — GitHub enforces
custom-domain uniqueness, and moving one means downtime between removing and
re-adding it.

| # | who | what |
| --- | --- | --- |
| 1 | **teammate** | DNS record for `gyakorlo.durerinfo.hu` → durer-aion's Pages |
| 2 | dev | PR: practice's workflows ported to the repo root with `paths` filters; Pages built from Actions; `apps/practice` built at base `/jatekok/`; static home page at `/`; `public/CNAME` = the new domain; `data-domains` extended to both domains; `check:versions` taught its new workflow paths |
| 3 | maintainer | Settings → Pages: source = GitHub Actions, custom domain = `gyakorlo.durerinfo.hu` |
| 4 | everyone | **Verify.** `jatek.durerinfo.hu` is still served by durer-jatekok throughout, so both sites are live at once and there is no rush. |
| 5 | maintainer | Cut over: replace durer-jatekok's published content with the redirect stub |
| 6 | **teammate** | Repoint the links on durerinfo.hu |
| 7 | dev | Later, in either order: `/proba-verseny/` (needs the S3 values first), #224's relay app at `/valto/`, then the designed home page |

Steps 1–4 have no user-visible effect. Step 5 is the only irreversible-feeling
moment and it is a one-file revert.

## Code changes step 2 needs

- `apps/practice/vite.config.js`: `base: '/'` → `'/jatekok/'`.
- `apps/practice/public/CNAME`: → the new domain (it is the file Pages reads).
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

## Open questions

1. ~~**Domain name.**~~ Decided: `gyakorlo.durerinfo.hu`. An English alias
   stays possible later as a DNS-level 301, never as a second Pages domain.
2. **Which of the three relay options** to take at cutover (above). This is
   the one that decides whether relay practice stays up.
3. ~~**Path language.**~~ Decided: Hungarian throughout — `/jatekok/`,
   `/valto/`, `/proba-verseny/`.
4. **What happens to the 2023 `gh-pages` branch** once #224's relay app serves
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
