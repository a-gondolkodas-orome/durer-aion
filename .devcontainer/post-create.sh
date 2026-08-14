#!/usr/bin/env bash
# Runs once, when the dev container is created.
set -euo pipefail

npm ci

# The apps read VITE_*/server settings from a per-app .env that the README asks
# each developer to create by hand from .env.sample. Seed them so the dev
# servers start on a fresh container; never overwrite an existing file, since
# a developer's own values live there.
for app in apps/*/; do
  if [ -f "${app}.env.sample" ] && [ ! -f "${app}.env" ]; then
    cp "${app}.env.sample" "${app}.env"
    echo "seeded ${app}.env from .env.sample"
  fi
done
