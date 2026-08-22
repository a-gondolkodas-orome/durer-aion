#!/usr/bin/env bash
# Runs once, when the dev container is created.
set -euo pipefail

npm ci

# The same seeding `npm run setup` does outside the container — the step a
# ready-to-run container should not make you remember.
npm run setup
