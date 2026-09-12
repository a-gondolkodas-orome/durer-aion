# Deploying the online competition round

`verseny.durerinfo.hu` runs on one virtual machine, as one `docker compose` stack, brought
up by hand over ssh. The machine checks out the repository and builds everything itself —
there is no pipeline and no registry.

We used AWS or Azure for deployment, but generally, the deployment is done in a virtual
machine, generally available almost everywhere. For cross vendor compatibility, please use
an Ubuntu installer for your instance.

Testers who only need to try the games and the UX get a lighter option with no server at
all — see *The dry run for testers* at the end.

`npm run stack:prod` starts three containers, defined in
[`docker-compose.yml`](./docker-compose.yml):

| service | what it is |
| --- | --- |
| `web` | nginx on port 80. Serves the built frontend, proxies `/socket.io/`, `/games`, `/team` and `/game` to the backend. |
| `backend` | the node server on port 8000, not published — only `web` reaches it. |
| `postgres` | the database, in a named volume. |

The frontend is not in any image: nginx bind-mounts `apps/online-frontend/dist` from the
host and `stack:prod` runs `npm run build` to fill it, which is why the machine needs the
Node toolchain and not just docker. The schema has no migrations — `sequelize.sync()`
creates it on first boot.

## Live competition vs. test drive

The steps below are the live deployment. To test the runbook itself on a throwaway
machine, follow the same steps with the right-hand values — each is repeated as a
`> **Test drive:**` note where it applies.

| | live competition | test drive |
| --- | --- | --- |
| code from | the year's private repo, deploy key | the public repo, HTTPS clone |
| domain | the real subdomain, static IP | a subdomain of one you already own |
| `.env.docker` | real secrets, rotated afterwards | throwaway values, still off the samples |
| teams | the real TSV; the `.export` goes back to the organisers | `scripts/test.tsv` |
| database | must survive; there are no backups | expendable |
| HTTP→HTTPS redirect | wanted; goes in the untracked `nginx-tls.conf` | skip |
| certificate renewal | set up the cron | skip |
| unattended upgrades | stop the timers for the competition window | leave them running |
| afterwards | stays up | tear the machine down **and delete the DNS record** |

## What the machine needs

- **Ubuntu 24.04 LTS.** Anything Debian-shaped works; the commands below are apt.
- **2 vCPU, 4 GB RAM.** The builds need it, not the serving.
- **A public IPv4**, with inbound **22, 80 and 443** — nothing else.
- **~20 GB disk.**

Everything after provisioning is identical across providers. Sizes that match, with rough
costs at the time of writing and what actually stops the bill:

| provider | size | ~cost | stopping the bill |
| --- | --- | --- | --- |
| Azure | Standard B2s | ~$30/mo, ~$0.042/h | deallocating stops compute, the managed disk keeps billing |
| DigitalOcean | Basic, 2 vCPU / 4 GB / 80 GB | $24/mo, $0.036/h | **destroy** the droplet; powering it off still bills |
| AWS | t3.medium | ~$30/mo, ~$0.042/h | stopping stops compute, the EBS volume keeps billing |

## First minutes on the machine

Patch it — the realistic risk to a box that lives for weeks is an unpatched service:

```bash
apt update && apt upgrade -y
```

If it asks about a locally modified `sshd_config`, keep the local version: those edits are
the image's, and the patched binary installs either way.

**Then reboot, if it asks for one.** `*** System restart required ***` in the MOTD means a
kernel or library was replaced and the running system is still on the old one — a patch that
has not taken effect:

```bash
sudo reboot   # then reconnect
```

Cheapest here, before anything is installed or running.

**Optional, for a machine that will live longer than the drive:** keep it patched by
itself. The rest of this section's upgrade advice only applies if you do this.

```bash
apt install unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

Unattended upgrades take security updates only and do not reboot on their own
(`grep Automatic-Reboot /etc/apt/apt.conf.d/50unattended-upgrades`), but they do restart
services — and a `docker-ce` or `containerd.io` upgrade bounces every container. Keep them
out of it:

```
// /etc/apt/apt.conf.d/51durer-blacklist
Unattended-Upgrade::Package-Blacklist {
    "docker-ce";
    "docker-ce-cli";
    "containerd.io";
};
```

**And stop the timers for the competition window**, so nothing at all moves while teams are
playing:

```bash
sudo systemctl stop apt-daily.timer apt-daily-upgrade.timer   # start them again afterwards
```

Then make a non-root user. Everything below runs as that user — `npm` as root leaves
root-owned files in `node_modules`:

```bash
adduser deploy
usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
```

**Log in as it from a second terminal before closing the first.** A broken `sshd` config or
a mis-copied key only shows up on the next login, which is when you no longer have a way
in.

**Optional, and worth it on anything that outlives the drive:** close root's own door, since
cloud images often ship `PermitRootLogin yes`.

```bash
printf 'PermitRootLogin prohibit-password\nPasswordAuthentication no\n' \
  | sudo tee /etc/ssh/sshd_config.d/99-hardening.conf
sudo sshd -t && sudo systemctl reload ssh
sshd -T | grep -E 'permitrootlogin|passwordauthentication'
```

A drop-in rather than an edit to `/etc/ssh/sshd_config`, because the `Include` at the top of
that file means later lines in it lose to whatever the directory already sets. `sshd -t`
validates before the reload.

Add swap on anything at or below 4 GB — the builds are what need it:

```bash
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

`swapon` lasts only until the next reboot. This line is what brings the file back after
one:

```bash
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

Optionally work inside `tmux`, since a dropped ssh session kills the build in progress:

```bash
sudo apt install tmux -y
tmux new -s deploy
```

## 1. Install docker

```bash
# Docker's own GPG key
sudo apt-get update
sudo apt-get install ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# their repository
echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install docker-ce docker-compose-plugin
```

Put yourself in the `docker` group — the npm scripts call `docker compose` without `sudo`:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

Never `sudo npm run …`; it leaves root-owned files in `node_modules`.

## 2. Get the code

The competition game stays secret until after the competition, so the live deployment
clones the year's **private** repository (see *Competition secrecy* in
[`README.md`](./README.md), which also covers what to set up when that repo is
created). That needs a deploy key:
[generate a keypair](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)
on the machine, add the public half to that repository's deploy keys, and point ssh at the
private half in `~/.ssh/config` — an `ssh-agent` does not survive a reboot:

```
Host github.com
	HostName github.com
	IdentityFile ~/.ssh/deploy_key
	User git
```

```bash
sudo apt install git -y
git clone git@github.com:a-gondolkodas-orome/<the-private-repo>.git
cd <the-private-repo>
```

> **Test drive:** no key needed — `git clone https://github.com/a-gondolkodas-orome/durer-aion.git`.

## 3. Install Node

The exact version in [`.nvmrc`](./.nvmrc) — the same one CI and the backend image pin.
From inside the checkout, [nvm](https://github.com/nvm-sh/nvm) reads it:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
source ~/.bashrc
nvm install    # picks up .nvmrc
```

## 4. Configure

```bash
npm ci
npm run setup   # creates the gitignored .env files from their committed samples
```

Edit `.env.docker` before the first `up`:

- `ADMIN_CREDENTIALS` — the admin pages' basic-auth password. Sample value `admin`.
- `BOT_CREDENTIALS` — sample value `bot_passwd`.
- `POSTGRESQL_PASSWORD` — sample value `postgres_passwd`. It is also in the backend's
  `DATABASE_URL`, so change it here and nowhere else.

The other files `npm run setup` creates are frontend build settings; the samples are fine.
[`README.md`](./README.md), under *Configuration you may want to change*, says what reads
which.

> **Test drive:** throwaway values are fine, but still change all three credentials off the
> samples — the machine is on the internet.

## 5. Close the ports

Use the provider's firewall — Azure network security group, DigitalOcean cloud firewall,
AWS security group — and allow **22, 80 and 443** inbound only.

The stack publishes nothing else: postgres has no `ports:` in `docker-compose.yml`, only in
the dev overlay, and there on loopback. The firewall is what keeps it that way if a later
change publishes something. Host `ufw` is not enough on its own — docker's own iptables
rules for published ports bypass it.

## 6. Bring it up

```bash
npm run stack:prod
```

Reinstalls the dependencies if a manifest or the lockfile has moved since the last run,
builds the frontend, builds the backend image, starts the three containers detached, and
returns only once the backend is healthy. When it is not:

```bash
npm run stack:ps
npm run stack:logs   # Ctrl-C stops following, not the stack
```

## 7. Import the teams

Drop the TSV into `scripts/` on the host — that directory is bind-mounted into the
container — and name it:

```bash
docker compose --env-file=.env.docker exec backend ./scripts/import_teams.sh scripts/<file>.tsv
```

This writes `scripts/<file>.tsv.export` back on the host, with the generated join codes.
The admin page's TSV upload does the same job through the browser.

If the backend will not stay up, `exec` has nothing to enter. Run the importer as a
one-off container instead — it needs postgres and `DATABASE_URL`, not a server that
boots:

```bash
docker compose --env-file=.env.docker run --rm backend ./scripts/import_teams.sh scripts/<file>.tsv
```

> **Test drive:** `npm run teams:import` runs the same thing against `scripts/test.tsv`.

## 8. A domain and HTTPS

Point an A record at the machine and wait for it to resolve — until it does, the certificate
below has nothing to validate against:

```bash
dig +short @1.1.1.1 verseny.durerinfo.hu   # the machine's IP, once it answers at all
```

A public resolver rather than the machine's own, which may still be holding the `NXDOMAIN`
it cached before the record existed. A name nobody has asked for yet answers within seconds
of the record being created; one you queried too early takes as long as the zone's negative
cache instead, typically 5 to 60 minutes. Neither is the "24 to 48 hours" that belongs to
changing a domain's nameservers, which this is not.

The machine's address is its own for as long as it exists, so that is enough. A reserved
address (DigitalOcean reserved IP, AWS elastic IP) buys something else — rebuilding the
machine under an unchanged DNS record — which is worth having live and not on a drive. It
also bills while *unattached*, so taking one adds a third thing to release at teardown.

Issue the certificate with the stack up — nginx serves the challenge out of `dist`, so
nothing has to stop:

```bash
sudo mkdir -p /etc/letsencrypt
sudo docker run --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v "$PWD/apps/online-frontend/dist:/webroot" \
  certbot/certbot certonly --webroot -w /webroot \
  -d verseny.durerinfo.hu --agree-tos -m you@example.com -n
```

Then write the TLS half of the nginx config. **`nginx-tls.conf` is a new file you create**,
at the root of the checkout beside `docker-compose.yml`; it is gitignored, because it names
this machine's certificate and belongs to no other.

The tracked config it extends is `apps/online-frontend/nginx/nginx.conf`, which includes
`/etc/nginx/tls/*.conf`. The compose override below mounts your new file there, so nothing
tracked is edited.

These four lines are the whole file. The include sits *inside* the `server` block that is
already there, next to its `listen 80;`, so this is a fragment spliced into that block —
no `server { }` of its own, no braces at all:

```nginx
listen              443 ssl;
server_name         verseny.durerinfo.hu;
ssl_certificate     /etc/letsencrypt/live/verseny.durerinfo.hu/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/verseny.durerinfo.hu/privkey.pem;
```

**TLS has to terminate in this nginx, in the same `server` block that proxies to the
backend** — which is what the include gives you. The tracked config sets `X-Forwarded-Proto
$scheme` on every proxied location, and that header is the only way the backend knows to
put `Secure` on the team's session cookie
(`apps/online-backend/src/server/team_session.ts`). Anything that hands this nginx a plain
HTTP request — a proxy on the host, or a second `server` block forwarding to port 80 —
makes `$scheme` say `http`, and the cookie ships without `Secure` while everything appears
to work.

The same block sets `X-Forwarded-For $remote_addr`, which is the client the backend counts
join-code attempts against (`apps/online-backend/src/server/rate_limit.ts`). A proxy in
front of this nginx costs that too, and less quietly: every team would then arrive from one
address and share one allowance, so a competition's worth of mistyped codes would lock
everybody out together. If one has to be there, it must pass the client's address through
and this nginx must stop overwriting it.

Then `docker-compose.tls.yml`, beside `docker-compose.yml` in the checkout, opening the port
and mounting both the certificates and that file:

```yaml
services:
  web:
    ports:
      - 443:443
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - ./nginx-tls.conf:/etc/nginx/tls/tls.conf:ro
```

Rebuild with the override. `npm run deps` is the install `npm run stack:prod` does for
itself and this path does not — without it a pull that moved the lockfile builds the
frontend against the tree the previous release installed:

```bash
npm run deps
npm run build
docker compose --env-file=.env.docker -f docker-compose.yml -f docker-compose.tls.yml up --build --wait
```

**For the live deployment, once that certificate exists**, send plain HTTP to HTTPS by
adding this to `nginx-tls.conf` and rebuilding again. Certbot's renewal fetches its
challenge over plain HTTP, so that one path has to survive the redirect; everything else on
port 80 goes to HTTPS before it can reach a proxied location, which is what keeps a
plaintext request from ever reporting the wrong scheme to the backend.

```nginx
set $to_https 0;
if ($scheme = http)                                { set $to_https 1; }
if ($request_uri ~ ^/\.well-known/acme-challenge/) { set $to_https 0; }
if ($to_https)                                     { return 301 https://$host$request_uri; }
```

Adding it before the first certificate exists is what breaks issuance, which is why it
comes second.

Rebuild with the same three commands as above.

**Then check the cookie**, because losing `Secure` is silent. Log in as a team with
devtools' **Network** tab open, select the `POST /team/join` request — the login itself,
answered with `204` and no body — and read `Set-Cookie` in its response headers: it must
carry `Secure` alongside `HttpOnly` and `SameSite=Lax`.

The Application tab lists it too, but under path `/team/me` rather than the site root,
because it is scoped to the routes that read it. If the login request is a
`GET /team/join/<code>` instead, the deployment predates the session cookie
(`apps/online-backend/src/server/team_session.ts` will not exist in the checkout) and there
is nothing to look for.

Renew weekly from cron; certbot only acts when the certificate is near expiry. A
`npm run build` mid-renewal empties `dist` and takes the challenge file with it — rerun.

```bash
sudo docker run --rm -v /etc/letsencrypt:/etc/letsencrypt \
  -v /home/USER/durer-aion/apps/online-frontend/dist:/webroot \
  certbot/certbot renew --webroot -w /webroot
docker compose --env-file=.env.docker exec web nginx -s reload
```

> **Test drive:** use a subdomain of a domain you already own — one A record at the VM's
> IP, no registrar, no cost. Skip the renewal cron. Three things to check on the parent
> domain first: a CAA record refuses issuance (`dig CAA example.hu`); HSTS with
> `includeSubDomains` makes port 80 unusable in a browser and a cert mistake unrecoverable;
> and the name reaches certificate transparency logs, so keep it neutral rather than a hint
> at the unreleased game.

## 9. Updating a deployment

```bash
git pull
npm run stack:prod
```

With TLS set up, use the three-command form from step 8 instead — `stack:prod` takes no
arguments.

`sequelize.sync()` creates missing tables but does not alter existing ones, so **a release
that changed a column needs the change applied by hand**, or the volume dropped
(`npm run stack:down -- --volumes`, then import the teams again) if the data is expendable.

All three services are `restart: unless-stopped`, so a reboot brings the stack back by
itself — with whatever image and `dist` were last built, since nothing rebuilds on boot.

> **Test drive:** tear the machine down instead, per the last column of the provider table.
> Stopping is not deleting on any of them, and on DigitalOcean it does not stop the bill.
> **Delete the DNS record too.** The IP goes back to the provider's pool, and a record left
> pointing at it lets whoever gets that IP next serve their own content — with their own
> valid certificate — on a subdomain of your domain.

## Getting inside a container

```bash
npm run stack:ps                                          # what is running
docker compose --env-file=.env.docker exec backend bash   # a shell in one
```

`scripts/admin.py` is the post-competition scoring pull. Set `DURER_BASE_URL` to the site's
URL — port 8000 is not published, nginx is the way in — and `DURER_ADMIN_PASSWORD` to
`ADMIN_CREDENTIALS`, or let it prompt.

## Checking it works

Walk [`README.md`](./README.md)'s *Checking it works* list against the public URL instead
of `http://localhost`. Reloading mid-match and opening a second tab on the same join code
are the two items only a deployed instance exercises: both go through the websocket, where
a proxy misconfiguration behind TLS shows up.

> **Test drive:** the frontend reports nothing unless its `.env` sets `VITE_SENTRY_DSN`,
> which the samples leave empty. The backend still reports from a DSN written into
> `apps/online-backend/src/server.ts`, so its errors do leave the machine — see *Error
> reporting* in [`README.md`](./README.md).

## Troubleshooting

**`npm ci` fails with EACCES.** Something ran as root earlier.

```bash
sudo chown -R `whoami` node_modules
```

**The site loads but every request 502s.** The backend is not healthy; `npm run stack:logs`
says why. Usually a missing variable in `.env.docker` — the server validates them at boot
and exits.

## The dry run for testers

The offline build of the competition, published to GitHub Pages from the year's private
repo, so testers can play the upcoming games and try the UX before there is a server. Two
ways to publish it, running the same `scripts/deploy-dry-run.mjs` either way.

From a checkout of that repo:

```bash
npm run deploy
```

Or, inside that repo on GitHub, **Actions → dry-run-deploy → Run workflow**, which needs
nothing checked out and lets you pick the branch to publish. The workflow only appears once
the file is on the repo's default branch, and it is dispatch-only — see *Competition
secrecy* in [`README.md`](./README.md).

Either way the script builds `offline-frontend` through turbo and pushes `dist` to the
`gh-pages` branch, which Pages serves. **There is nothing to edit first.** The base path is
the repository's own name, read off the checkout's `origin` remote, so it is right in both
routes and there is no per-competition value to set — or to leak by committing it, which is
what the `PUBLIC_URL` placeholder it replaced was for (#296). It also refuses to publish to
the public repository, and refuses to ship a `CNAME`: the site's protection is that its
`github.io` URL is unguessable, and a custom domain would undo that.

**The site is public.** Pages serves it to anyone; the deliberately unguessable repository
name is the whole of the protection. Treat the link as the secret, and understand that this
is obscurity rather than access control — a known risk, accepted, because the audience is a
handful of testers and the exposure lasts weeks.

**Nothing publishes it automatically.** No push deploys it; a maintainer runs the command
or dispatches the workflow when there is something for testers to see.

---

The public practice site (`gyakorlo.durerinfo.hu`) is a different thing entirely: built and
published by `.github/workflows/pages-deploy.yml` on every push to `main`, no server
involved. `scripts/assemble-site.mjs` is what it runs. That workflow is guarded to the
public repository and this one guarded away from it, so neither can publish the other's
site.
