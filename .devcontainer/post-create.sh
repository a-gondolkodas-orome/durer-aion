#!/usr/bin/env bash
# Runs once, when the dev container is created.
set -euo pipefail

# The gh and Claude Code config directories are named volumes (see devcontainer.json).
# Docker seeds a new volume from the image's own path, ownership included — and this
# container is a plain `image:` with no build step, so those paths do not exist and the
# volumes come up root-owned, which makes `gh auth login` fail. apps/strategy-practice
# creates them as `node` in its Dockerfile instead; here the fix belongs in this script,
# which also repairs a volume left root-owned by an earlier version of this setup.
if command -v sudo >/dev/null; then
  sudo mkdir -p "$HOME/.config/gh" "$HOME/.claude"
  sudo chown -R "$(id -u):$(id -g)" "$HOME/.config/gh" "$HOME/.claude"
fi

npm ci

# The same seeding `npm run setup` does outside the container — the step a
# ready-to-run container should not make you remember.
npm run setup
