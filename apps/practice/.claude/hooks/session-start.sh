#!/bin/bash
set -euo pipefail

# Only needed on Claude Code on the web, where the container starts without
# node_modules; local and devcontainer setups run npm ci themselves.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Attribution for web sessions: the agent writes the code, so it is the author.
# Set before the Node block below so a failed install cannot leave commits
# misattributed.
git config user.name "Claude"
git config user.email "noreply@anthropic.com"

# Whoever wants the credit names themselves in CLAUDE_COMMIT_COAUTHOR, in their
# own cloud environment. There is deliberately no default: a name hardcoded here
# would be appended to every other contributor's web session too, crediting them
# for work they did not do. Unset first, so that a reused container cannot carry
# a previous session's value into one that sets nothing.
git config --unset claude.coauthor 2> /dev/null || true
if [ -n "${CLAUDE_COMMIT_COAUTHOR:-}" ]; then
  git config claude.coauthor "$CLAUDE_COMMIT_COAUTHOR"
fi

# `git commit -m` ignores commit.template and every commit here is made with -m,
# so the trailer has to be appended by a hook instead. .git/hooks is not part of
# the checkout, so it is written per session rather than committed. The hook
# reads the co-author back out of git config so that this heredoc stays quoted.
mkdir -p .git/hooks
cat > .git/hooks/prepare-commit-msg << 'HOOK'
#!/bin/bash
set -euo pipefail

# $2 is the message source. Merges and squashes take their message from git
# rather than from the agent, so they are left alone; an amend re-runs this hook
# over a message that already carries the trailer, which addIfDifferent skips.
case "${2:-}" in
  merge|squash) exit 0 ;;
esac

coauthor=$(git config claude.coauthor || true)
[ -n "$coauthor" ] || exit 0

# addIfDifferent rather than doNothing: a Co-authored-by trailer naming Claude
# is often already present, and doNothing keys off the token alone, which would
# drop the human's line whenever it is.
git interpret-trailers --in-place --if-exists addIfDifferent \
  --trailer "Co-authored-by: $coauthor" "$1" ||
  # Attribution is not worth blocking a commit over.
  echo "prepare-commit-msg: could not append the co-author trailer" >&2
HOOK
chmod +x .git/hooks/prepare-commit-msg

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
