#!/bin/bash
set -euo pipefail

# Only needed on Claude Code on the web, where the container starts without
# node_modules; local and devcontainer setups run npm ci themselves.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Exact versions are pinned (save-exact + package-lock), so npm ci is the
# right install. Skip it when node_modules already exists — the container
# state is cached between sessions, so this keeps repeat startups fast.
if [ ! -d node_modules ]; then
  npm ci
fi
