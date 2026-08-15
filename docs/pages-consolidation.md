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
artifact — but only if we lay them out deliberately.

## The four sites

| what | where it is today | notes |
| --- | --- | --- |
| **Strategy game practice** | `jatek.durerinfo.hu` (durer-jatekok, Pages from Actions) | The live practice site. Hash-routed, so every deep link is `#/game/…`. |
| **Relay practice** | `https://a-gondolkodas-orome.github.io/durer-aion/` (durer-aion `gh-pages` branch) | A Create React App build from **August 2023**. #224 is building its modern replacement as `apps/relay-practise-frontend`. |
| **Competition dry run** | deployed per competition from that year's private repo, e.g. `github.io/durer19o-xn7ElDP7nQm2M1/` | `apps/offline-frontend`: the full competition shell, both rounds, in-browser bots. Also uploads play data to S3 (see below). |
| **The real competition** | `verseny.durerinfo.hu` | nginx + docker, **not** GitHub Pages. Unaffected by any of this. |

### About the competition dry run

`apps/offline-frontend` mounts the same `Main` shell the live site uses, with
`RelayClient` and `StrategyClient`, an `OfflineClientRepository` and in-browser
bots — so it is a dry run of *both* rounds, not a game demo.

It also posts every start/step/end — including `G`, `ctx` and the full match
log — to an S3 bucket keyed by join code and timestamp
(`VITE_S3_BUCKET_NAME` / `VITE_S3_FOLDER`). Two consequences:

- Anyone who has the URL can write to that bucket, which is why its address is
  obscure and unlinked. Any permanent home for it should stay unlinked.
- `sendData` **throws** when those vars are unset, so whatever builds it needs
  them in the environment. They are placeholders in `.env.sample`; the real
  values are not in this repo.

`PUBLIC_URL=/durer19o-xn7ElDP7nQm2M1` in `apps/offline-frontend/package.json`
is a leftover: per `DEPLOYMENT.md` that value is a *repository name*, set
locally at deploy time and explicitly not meant to be committed.

## Target layout

One Pages site on durer-aion, one artifact, built by one workflow:

```
gyakorlo.durerinfo.hu/
  /                  a home page linking to the two practice sites
  /strategy-game/    apps/practice          (today's jatek.durerinfo.hu)
  /relay/            apps/relay-practise-frontend  (#224; replaces the 2023 build)
  /<unlinked>/       apps/offline-frontend  (optional — see open questions)
```

`jatek.durerinfo.hu` stays on the durer-jatekok repo and becomes a redirect.

### Why a home page is not optional

The moment the domain exists, `/` serves something or visitors get a bare 404.
A ten-line static `index.html` with two links is enough for the first step; a
designed one can follow. It also answers the "I landed on the wrong subpage"
problem — the site now holds two different things, and the root is where that
becomes visible.

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
| 7 | dev | Later: #224's relay app at `/relay/`, then the designed home page |

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
2. **Does the competition dry run get a permanent home here?** Its
   competition-time deploy comes from the year's private repo, so publishing it
   at `/competition` (or `/proba-verseny`, which says "dry run" out loud on a
   domain called *gyakorlo*) would be a new, permanently available site rather
   than a migration of an existing one. If yes, it needs the S3 variables in
   the build environment and should stay off the home page.
3. **What happens to the 2023 `gh-pages` branch** once #224's relay app serves
   `/relay/`. Deleting the branch is safe after the Pages source moves to
   Actions, but the old `github.io/durer-aion/` URL then 404s unless the home
   page inherits it — which it does, since that URL redirects to the custom
   domain once one is set.
