# Deploying the online competition round

`verseny.durerinfo.hu` runs on one virtual machine, as one `docker compose` stack, brought
up by hand over ssh. The machine checks out the repository and builds everything itself —
there is no pipeline and no registry.

> **Not re-run end to end yet.** Rewritten against the current repository, but the test
> deployment that proves it has not happened. Correct this file from what actually happens.

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
| domain | the real subdomain, static IP | a throwaway domain, ~$1–3/yr |
| `.env.docker` | real secrets, rotated afterwards | throwaway values, still off the samples |
| competition window | the real start and end | anything covering your session |
| teams | the real TSV; the `.export` goes back to the organisers | `scripts/test.tsv` |
| database | must survive; there are no backups | expendable |
| HTTP→HTTPS redirect | wanted; needs a repo change | skip |
| certificate renewal | set up the cron | skip |
| afterwards | stays up; a reboot takes the site down | tear the machine down |

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

Add swap on anything at or below 4 GB — the builds are what need it:

```bash
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

Add it to `/etc/fstab` to survive a reboot. Work inside `tmux`, since a dropped ssh session
kills the build in progress:

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

The version in [`.nvmrc`](./.nvmrc), which is what CI and the backend image run. From
inside the checkout, [nvm](https://github.com/nvm-sh/nvm) reads it:

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
- `GAME_GLOBAL_START_T` and `GAME_GLOBAL_END_T` — the competition window. **The sample end
  date is in the past**, so leaving it serves a competition that is already over.

The other files `npm run setup` creates are frontend build settings; the samples are fine.
[`README.md`](./README.md), under *Configuration you may want to change*, says what reads
which.

> **Test drive:** throwaway values are fine, but still change all three off the samples —
> the machine is on the internet. Set the window to cover your session.

## 5. Close the ports

Before bringing the stack up. `docker-compose.yml` publishes postgres on every interface,
so until 5432 is closed this machine is a reachable database.

Use the provider's firewall — DigitalOcean cloud firewall, Azure network security group,
AWS security group — and allow **22, 80 and 443** inbound only. Host `ufw` is not enough:
docker's own iptables rules for published ports bypass it.

## 6. Bring it up

```bash
npm run stack:prod
```

Builds the frontend, builds the backend image, starts the three containers detached, and
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

> **Test drive:** `npm run teams:import` runs the same thing against `scripts/test.tsv`.

## 8. A domain and HTTPS

Point an A record at the machine and wait for it to resolve. Give the machine a static
address first if the provider hands out ephemeral ones (a DigitalOcean reserved IP, an AWS
elastic IP).

Issue the certificate with the stack up — nginx serves the challenge out of `dist`, so
nothing has to stop:

```bash
sudo mkdir -p /etc/letsencrypt
sudo docker run --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v "$PWD/apps/online-frontend/dist:/webroot" \
  certbot/certbot certonly --webroot -w /webroot \
  -d verseny.example.com --agree-tos -m you@example.com -n
```

Then two files on the host, outside the repository so `git pull` leaves them alone.
`docker-compose.tls.yml`:

```yaml
services:
  web:
    ports:
      - 443:443
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - ./nginx-tls.conf:/etc/nginx/conf.d/tls.conf:ro
```

and `nginx-tls.conf`:

```nginx
server {
    listen 443 ssl;
    server_name verseny.example.com;

    ssl_certificate     /etc/letsencrypt/live/verseny.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/verseny.example.com/privkey.pem;

    # Hand off to this same container's port 80 server, so the routing stays defined once,
    # in apps/online-frontend/nginx/nginx.conf, instead of being copied here.
    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        # The games are websockets; without these a match connects and never updates.
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

Port 80 keeps serving plaintext. Forcing a redirect means editing
`apps/online-frontend/nginx/nginx.conf`, a change to the repository rather than to this
machine.

Renew weekly from cron; certbot only acts when the certificate is near expiry. A
`npm run build` mid-renewal empties `dist` and takes the challenge file with it — rerun.

```bash
sudo docker run --rm -v /etc/letsencrypt:/etc/letsencrypt \
  -v /home/USER/durer-aion/apps/online-frontend/dist:/webroot \
  certbot/certbot renew --webroot -w /webroot
docker compose --env-file=.env.docker exec web nginx -s reload
```

> **Test drive:** a throwaway domain works the same. Skip the renewal cron.

## 9. Updating a deployment

```bash
git pull
npm run stack:prod
```

With TLS set up, use the two-command form from step 8 instead — `stack:prod` takes no
arguments.

`sequelize.sync()` creates missing tables but does not alter existing ones, so **a release
that changed a column needs the change applied by hand**, or the volume dropped
(`npm run stack:down -- --volumes`, then import the teams again) if the data is expendable.

No service has a restart policy, so a reboot leaves the site down until someone runs
`stack:prod` again.

> **Test drive:** tear the machine down instead, per the last column of the provider table.
> Stopping is not deleting on any of them, and on DigitalOcean it does not stop the bill.

## Getting inside a container

```bash
npm run stack:ps                                          # what is running
docker compose --env-file=.env.docker exec backend bash   # a shell in one
```

`scripts/admin.py` is the post-competition scoring pull. Point its `BASE_URL` at the site's
URL — port 8000 is not published, nginx is the way in — and its `ADMIN_PASSWORD` at
`ADMIN_CREDENTIALS`.

## Checking it works

Walk [`README.md`](./README.md)'s *Checking it works* list against the public URL instead
of `http://localhost`. Reloading mid-match and opening a second tab on the same join code
are the two items only a deployed instance exercises: both go through the websocket, where
a proxy misconfiguration behind TLS shows up.

> **Test drive:** the Sentry DSN is compiled in, not configured, so your errors land in the
> real project alongside the live ones.

## Troubleshooting

**`npm ci` fails with EACCES.** Something ran as root earlier.

```bash
sudo chown -R `whoami` node_modules
```

**The site loads but every request 502s.** The backend is not healthy; `npm run stack:logs`
says why. Usually a missing variable in `.env.docker` — the server validates them at boot
and exits.

**The competition says it is over.** `GAME_GLOBAL_END_T` in `.env.docker`; see step 4.

## The dry run for testers

The offline build of the competition, published to GitHub Pages from the year's private
repo, so testers can play the upcoming games and try the UX before there is a server. One
command, from a checkout of that repo:

```bash
npm run deploy
```

npm runs the root `predeploy` first, which builds `offline-frontend` with `PUBLIC_URL` as
its base path; `deploy` pushes `apps/offline-frontend/dist` to the `gh-pages` branch of the
private repo, which has Pages enabled and serves it. `PUBLIC_URL` lives in
`apps/offline-frontend/package.json` and is that repo's name, so set it when the year's repo
is created and the build's asset paths follow.

**The site is public.** Pages serves it to anyone; the deliberately unguessable repository
name is the whole of the protection. Treat the link as the secret, and understand that this
is obscurity rather than access control — a known risk, accepted, because the audience is a
handful of testers and the exposure lasts weeks.

**Nothing publishes it automatically.** A maintainer runs the command when there is
something for testers to see.

---

The public practice site (`gyakorlo.durerinfo.hu`) is a different thing entirely: built and
published by `.github/workflows/pages-deploy.yml` on every push to `main`, no server
involved. See [`docs/pages-consolidation.md`](./docs/pages-consolidation.md).
