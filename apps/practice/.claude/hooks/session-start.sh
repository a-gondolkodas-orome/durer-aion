#!/bin/bash
set -euo pipefail

# Only needed on Claude Code on the web, where the container starts without
# node_modules; local and devcontainer setups run npm ci themselves.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# The web container is not the devcontainer, so nothing there pins Node: it
# ships whatever its image has, and an npm of the wrong major resolves this
# lockfile differently and fails `npm ci` outright. nvm is in the image, so
# install the pinned Node and put it ahead of the image's own on PATH.
# Symlinks are what makes that stick — every later shell is a fresh process,
# so anything this one exports dies with it, and ~/.bashrc returns early for
# non-interactive shells before it would load nvm.
export NVM_DIR="${NVM_DIR:-/opt/nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # nvm.sh returns non-zero on a clean load, which `set -e` would treat as fatal.
  . "$NVM_DIR/nvm.sh" || true
  nvm install > /dev/null  # no argument: reads .nvmrc, so the pin stays single-sourced
  mkdir -p "$HOME/.local/bin"
  for bin in node npm npx corepack; do
    ln -sf "$(dirname "$(nvm which current)")/$bin" "$HOME/.local/bin/$bin"
  done
  case ":$PATH:" in
    *":$HOME/.local/bin:"*) ;;
    *) echo "session-start: $HOME/.local/bin is not on PATH, so the pinned Node is not in use." >&2 ;;
  esac
fi

# Exact versions are pinned (save-exact + package-lock), so npm ci is the right
# install. Ask npm whether the tree is sound rather than testing for the
# directory: a failed npm ci leaves a partial node_modules behind, which a
# directory test reads as installed, and the next session inherits the wreckage
# because the container state is cached. A sound tree answers in well under a
# second, so repeat startups stay fast.
if ! npm ls --depth=0 > /dev/null 2>&1; then
  npm ci
fi
