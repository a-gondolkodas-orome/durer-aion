#!/usr/bin/env bash
# Runs once, when the dev container is created.
set -euo pipefail

npm ci

# Several env files are gitignored and the README asks each developer to create
# them by hand from a committed *.sample — the step a ready-to-run container
# should not make you remember. Seed every one of them:
#
#   .env.docker.sample            -> .env.docker   (docker compose --env-file)
#   .env.local.sample             -> .env.local    (read by common-frontend's tsdown config)
#   apps/<app>/.env.sample        -> apps/<app>/.env
#
# Never overwrite an existing file: a developer's own values live there, and
# for .env.docker those are credentials worth keeping.
for sample in .env*.sample apps/*/.env*.sample; do
  [ -f "$sample" ] || continue          # no match: the glob stayed literal
  target="${sample%.sample}"
  if [ ! -f "$target" ]; then
    cp "$sample" "$target"
    echo "seeded $target from $(basename "$sample")"
  fi
done
