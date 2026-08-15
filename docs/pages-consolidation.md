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
| **Relay practice** | `https://a-gondolkodas-orome.github.io/durer-aion/` (durer-aion `gh-pages` branch) | A Create React App build from **August 2023**. #224 is building its modern replacement as `apps/relay-practise-frontend`. |
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
- `sendData` **throws** when those vars are unset, so whatever builds it needs
  them in the environment. They are placeholders in `.env.sample`, and the real
  values are not in this repo — **this is a prerequisite for `/proba-verseny/`,
  not a detail**: without them that subpage throws on the first move.

Note that `apps/offline-frontend`'s `predeploy` carries
`PUBLIC_URL=/durer19o-xn7ElDP7nQm2M1`, which is **not** a URL this site has to
preserve. Per `DEPLOYMENT.md` that value is a *repository name*, set locally at
deploy time for one competition and explicitly not meant to be committed. It
gets replaced by the `/proba-verseny/` base, and giving the dry run a permanent
home here is new — it has never had one.

## Target layout

One Pages site on durer-aion, **one home page and three subpages**, all in one
artifact built by one workflow:

```
gyakorlo.durerinfo.hu/
  /                 home page — what this site is, and where to go
  /strategy-game/   apps/practice                 strategy game practice
                                                  (today's jatek.durerinfo.hu)
  /relay/           apps/relay-practise-frontend  relay practice
                                                  (#224; replaces the 2023 build)
  /proba-verseny/   apps/offline-frontend         competition dry run, both rounds
```

`jatek.durerinfo.hu` stays on the durer-jatekok repo and becomes a redirect
into `/strategy-game/`.

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
  location.replace('https://gyakorlo.durerinfo.hu/strategy-game/' + location.hash);
</script>
```

**To verify before Phase 7**: whether an *archived* repository keeps serving
Pages. If it does not, durer-jatekok stays un-archived with a README banner
instead of being archived.

## Sequence

Ordered so that nothing user-visible changes until the new site has been
verified, and so no domain is ever moved between repos — GitHub enforces
custom-domain uniqueness, and moving one means downtime between removing and
re-adding it.

| # | who | what |
| --- | --- | --- |
| 1 | **teammate** | DNS record for `gyakorlo.durerinfo.hu` → durer-aion's Pages |
| 2 | dev | PR: practice's workflows ported to the repo root with `paths` filters; Pages built from Actions; `apps/practice` built at base `/strategy-game/`; static home page at `/`; `public/CNAME` = the new domain; `check:versions` taught its new workflow paths |
| 3 | maintainer | Settings → Pages: source = GitHub Actions, custom domain = `gyakorlo.durerinfo.hu` |
| 4 | everyone | **Verify.** `jatek.durerinfo.hu` is still served by durer-jatekok throughout, so both sites are live at once and there is no rush. |
| 5 | maintainer | Cut over: replace durer-jatekok's published content with the redirect stub |
| 6 | **teammate** | Repoint the links on durerinfo.hu |
| 7 | dev | Later, in either order: `/proba-verseny/` (needs the S3 values first), #224's relay app at `/relay/`, then the designed home page |

Steps 1–4 have no user-visible effect. Step 5 is the only irreversible-feeling
moment and it is a one-file revert.

## Code changes step 2 needs

- `apps/practice/vite.config.js`: `base: '/'` → `'/strategy-game/'`.
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

## Open questions

1. **Domain name** — `gyakorlo.durerinfo.hu` or `practice.durerinfo.hu`. The
   audience and the domain are Hungarian, which argues for `gyakorlo`. Decide
   *before* step 1: changing it afterwards repeats the whole sequence.
2. **Who holds the real S3 values** (`VITE_S3_BUCKET_NAME`, `VITE_S3_FOLDER`).
   They are the one hard blocker for `/proba-verseny/` — `sendData` throws
   without them — and they are not in this repo. Needed as build secrets before
   that subpage can ship; the other two subpages do not depend on them.
3. **Path language.** `proba-verseny` is Hungarian while `strategy-game` and
   `relay` are English. Consistent naming either way would read better —
   Hungarian throughout (`jatekok`, `valto`, `proba-verseny`) or English
   throughout — but the paths are cheap to change now and expensive later, once
   they are linked from durerinfo.hu.
4. **What happens to the 2023 `gh-pages` branch** once #224's relay app serves
   `/relay/`. Deleting the branch is safe after the Pages source moves to
   Actions, but the old `github.io/durer-aion/` URL then 404s unless the home
   page inherits it — which it does, since that URL redirects to the custom
   domain once one is set.
