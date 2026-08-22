# Deploying the online competition round

This is how `verseny.durerinfo.hu` runs: one virtual machine, one `docker compose`
stack, brought up by hand over ssh. There is no build pipeline and no registry — the
machine checks out the repository and builds everything on itself.

> **Not re-run end to end yet.** This runbook was rewritten against the current
> repository but the test deployment that proves it has not happened. Until it has, treat
> every command as unverified, and correct this file from what actually happens.

`npm run stack:prod` starts three containers, defined in
[`docker-compose.yml`](./docker-compose.yml):

| service | what it is |
| --- | --- |
| `web` | nginx on port 80. Serves the built frontend and proxies `/socket.io/`, `/games`, `/team` and `/game` to the backend. |
| `backend` | the node server, port 8000, not published — only `web` reaches it. |
| `postgres` | the database, in a named volume. |

Two things about that are easy to trip over later:

- **The frontend is not in any image.** nginx bind-mounts `apps/online-frontend/dist`
  from the host, and `stack:prod` runs `npm run build` first to fill it. That is why the
  machine needs the full Node toolchain and not just docker.
- **There are no migrations.** The schema is created on first boot by
  `sequelize.sync()`. A fresh database gets the right tables; an existing one whose
  columns have since changed does not — see *Updating a deployment* below.

## What the machine needs

- **Ubuntu 24.04 LTS.** Anything Debian-shaped works; the commands below are apt.
- **2 vCPU and 4 GB RAM.** The memory is for building, not for serving: `npm ci`, a turbo
  build of every workspace, and a `docker build` that runs its own `npm ci` inside.
- **A public IPv4 address**, and inbound **22, 80 and 443** — nothing else.
- **~20 GB of disk.** The checkout, `node_modules` and the docker images together are
  most of it.

Which provider is your call; everything after provisioning is identical. Some sizes that
match, with roughly what they cost at the time of writing and — the part that catches
people — what you have to do to stop paying:

| provider | size | ~cost | stopping the bill |
| --- | --- | --- | --- |
| DigitalOcean | Basic, 2 vCPU / 4 GB / 80 GB | $24/mo, $0.036/h | **destroy** the droplet; powering it off still bills |
| Hetzner | CX22 | ~€4.30/mo including the IPv4, hourly | delete the server |
| Azure | Standard B2s | ~$30/mo, ~$0.042/h | deallocating stops compute, the managed disk keeps billing |
| AWS | t3.medium | ~$30/mo, ~$0.042/h | stopping stops compute, the EBS volume keeps billing |

If you already have an Azure or AWS account, use it — no new signup, and the sizes above
are the ones this has historically run on. Starting from nothing, DigitalOcean and
Hetzner are cheaper and have less to click through.

### Swap

Worth adding on anything at or below 4 GB. The builds are the only thing that needs it,
and swapping through a network-backed disk is slow — but slow beats an out-of-memory kill
half an hour into a build.

```bash
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

Add it to `/etc/fstab` if it should survive a reboot.

### tmux

The build takes long enough that a dropped ssh session during it is annoying. `stack:prod`
itself is detached and survives a disconnect, but the `npm run build` in front of it does
not.

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

Then put yourself in the `docker` group, so the npm scripts — which call `docker compose`
without `sudo` — work:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

Never `sudo npm run …` instead: that runs the build as root and leaves root-owned files in
`node_modules`.

## 2. Get the code

The public repository needs no credentials:

```bash
sudo apt install git -y
git clone https://github.com/a-gondolkodas-orome/durer-aion.git
cd durer-aion
```

A deploy key is only needed for the year's **private** repository — the competition game
stays secret until after the competition, so it is developed and deployed from there (see
*Competition Secrecy* in [`CLAUDE.md`](./CLAUDE.md)). For that,
[generate a keypair](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)
on the machine, add the public half to that repository's deploy keys, and point ssh at the
private half in `~/.ssh/config` so it survives a reboot — an `ssh-agent` does not:

```
Host github.com
	HostName github.com
	IdentityFile ~/.ssh/deploy_key
	User git
```

## 3. Install Node

The version in [`.nvmrc`](./.nvmrc) — Node 24, which is what CI and the backend image run.
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

**Now edit `.env.docker`, before the first `up`.** The sample values are for a laptop and
this machine is on the internet:

- `ADMIN_CREDENTIALS` — the admin pages' basic-auth password, sample value `admin`.
- `BOT_CREDENTIALS` — sample value `bot_passwd`.
- `POSTGRESQL_PASSWORD` — sample value `postgres_passwd`, and it is also in the
  backend's `DATABASE_URL`, so change it here and nowhere else.
- `GAME_GLOBAL_START_T` and `GAME_GLOBAL_END_T` — the competition window. **The sample's
  end date is in the past**, so a stack left on the sample values serves a competition
  that is already over. That is the first thing that looks like a bug here and is not one.

The other files `npm run setup` creates are frontend build settings — accent colour,
language, feedback URL — and the sample values are fine. [`README.md`](./README.md), under
*Configuration you may want to change*, says what reads which.

## 5. Close the ports

**Before bringing the stack up.** `docker-compose.yml` publishes postgres on `5432` on
every interface, so until something blocks it this machine is an internet-reachable
database with the password you just set.

Use the provider's firewall — DigitalOcean's cloud firewall, an Azure network security
group, an AWS security group — and allow **22, 80 and 443** inbound, nothing else. `ufw`
on the host is not enough on its own: docker writes its own iptables rules for published
ports and they bypass it.

## 6. Bring it up

```bash
npm run stack:prod
```

That builds the frontend on the host, builds the backend image, and starts the three
containers detached. It returns only once they are up and the backend reports healthy, so
a clean exit means it is serving. `npm run stack:ps` and `npm run stack:logs` are what to look at when it is not
(Ctrl-C stops following the logs, not the stack).

The site is on port 80. Nothing else is published except postgres, which step 5 closed.

## 7. Import the teams

```bash
npm run teams:import
```

That runs `scripts/import_teams.sh` inside the backend container against
`scripts/test.tsv`. For the real thing, drop the TSV into `scripts/` on the host — that
directory is bind-mounted into the container in production too — and name it:

```bash
docker compose --env-file=.env.docker exec backend ./scripts/import_teams.sh scripts/<file>.tsv
```

The import writes `<file>.tsv.export` back next to it, with the generated join codes.

The admin page's TSV upload does the same job through the browser.

## 8. A domain and HTTPS

Point an A record at the machine's IP and wait for it to resolve. Give the machine a
static address first if the provider hands out ephemeral ones (a DigitalOcean reserved IP,
an AWS elastic IP) — otherwise a stop/start changes it out from under the DNS record.

Certificates come from Let's Encrypt, in a container, into a host directory the `web`
container also mounts. Do this **with the stack already up**: the challenge is served as an
ordinary file out of the directory nginx is already serving, so nothing has to be stopped,
and the same command works unattended for renewals later.

```bash
sudo mkdir -p /etc/letsencrypt
sudo docker run --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v "$PWD/apps/online-frontend/dist:/webroot" \
  certbot/certbot certonly --webroot -w /webroot \
  -d verseny.example.com --agree-tos -m you@example.com -n
```

Then two files on the host — not in the repository, so `git pull` leaves them alone.
`docker-compose.tls.yml`, which opens 443 and mounts the certificates and the config:

```yaml
services:
  web:
    ports:
      - 443:443
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - ./nginx-tls.conf:/etc/nginx/conf.d/tls.conf:ro
```

and `nginx-tls.conf`, the TLS listener:

```nginx
server {
    listen 443 ssl;
    server_name verseny.example.com;

    ssl_certificate     /etc/letsencrypt/live/verseny.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/verseny.example.com/privkey.pem;

    # Terminate TLS and hand the request to this same container's port 80 server, so the
    # routing stays defined once, in apps/online-frontend/nginx/nginx.conf. Copying the
    # four proxy locations here instead would be a second copy to keep in step.
    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        # The relay and the strategy game are websockets; without these the match
        # connects over HTTP and silently never updates.
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $http_connection;
    }
}
```

Bring the stack up with the override:

```bash
npm run build
docker compose --env-file=.env.docker -f docker-compose.yml -f docker-compose.tls.yml up --build --wait
```

Port 80 keeps serving plaintext alongside 443. Forcing a redirect means editing
`apps/online-frontend/nginx/nginx.conf`, which is a change to the repository rather than to
this machine — worth doing before a real competition, and worth leaving alone for a test.

Renewal is the same command as issuance, plus a reload:

```bash
# weekly, e.g. from cron; certbot only acts when a certificate is near expiry
sudo docker run --rm -v /etc/letsencrypt:/etc/letsencrypt \
  -v /home/USER/durer-aion/apps/online-frontend/dist:/webroot \
  certbot/certbot renew --webroot -w /webroot
docker compose --env-file=.env.docker exec web nginx -s reload
```

One caveat: `npm run build` empties `apps/online-frontend/dist`, so a rebuild that lands in
the middle of a renewal deletes the challenge file. Rerun the renewal if that happens.

## 9. Updating a deployment

```bash
git pull
npm run stack:prod
```

With TLS set up, that is the two-command form from step 8 instead — `stack:prod` takes no
arguments, so the override file has to go on a `docker compose` call of your own.

That rebuilds both the frontend and the backend image and replaces the containers. The
database volume is untouched — which is the thing to think about, because
`sequelize.sync()` creates missing tables but does not alter existing ones. A release that
changed a column needs the change applied by hand, or the volume dropped
(`npm run stack:down -- --volumes`, then import the teams again) if the data is expendable.

There is no restart policy on any of the services, so a reboot of the machine leaves the
site down until someone runs `stack:prod` again.

## Getting inside a container

```bash
npm run stack:ps                                          # what is running
docker compose --env-file=.env.docker exec backend bash   # a shell in one
```

`scripts/admin.py` is the post-competition scoring pull. Point its `BASE_URL` at the site's
own URL — the backend's port 8000 is not published, nginx is the way in — and its
`ADMIN_PASSWORD` at `ADMIN_CREDENTIALS`.

## Test deployments

Everything above works for a throwaway instance you tear down afterwards, which is the way
to check this runbook before trusting it in a competition. The cheap version: the smallest
row of the provider table above, billed by the hour, plus a ~$1–3/yr domain so the DNS and
certificate steps get exercised for real rather than skipped.

Two things to know before you start:

- **It will talk to the real Sentry.** The DSN is compiled in, not configured, in both the
  backend and the frontends, so a test deployment's errors land next to the real ones.
  `docs/must-keep-working.md` counts Sentry receiving events as part of this runbook
  working, so that is arguably the test passing — but it is worth knowing rather than
  discovering.
- **Tear down when done**, per the last column of the provider table. Stopping the machine
  is not the same as deleting it on any of them, and on DigitalOcean it does not stop the
  bill at all.

What to check while it is up is [`README.md`](./README.md)'s *Checking it works* list,
against the public URL instead of `http://localhost`. The two items that only a real
deployment exercises are reloading mid-match and opening a second tab on the same join
code: both go through the websocket, and a proxy misconfiguration behind TLS shows up
there and nowhere else.

## Troubleshooting

**`npm ci` fails with EACCES.** Something was run as root earlier.

```bash
sudo chown -R `whoami` node_modules
```

**The site loads but every request 502s.** The backend is not healthy;
`npm run stack:logs` says why. A missing variable in `.env.docker` is the usual cause —
the server validates all four at boot and exits.

**The competition says it is over.** `GAME_GLOBAL_END_T` in `.env.docker`; see step 4.

---

The public practice site (`gyakorlo.durerinfo.hu`) is a different thing entirely: it is
built and published by `.github/workflows/pages-deploy.yml` on every push to `main`, with
no server involved. See [`docs/pages-consolidation.md`](./docs/pages-consolidation.md).
