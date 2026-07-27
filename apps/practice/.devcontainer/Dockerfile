FROM mcr.microsoft.com/devcontainers/javascript-node:24-bookworm

# The image tag only pins the Node major (MCR publishes no Node patch tags), so the exact version
# comes from the node devcontainer feature — see devcontainer.json.

# npm's update-notifier advertises every new npm release, including majors this project has not
# adopted. The npm that matters here is the one bundled with the pinned Node, so keep it quiet.
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

# Must stay in sync with the "playwright" version in package.json — a mismatch means
# node_modules/playwright looks for a browser revision that isn't in the image.
ARG PLAYWRIGHT_VERSION=1.62.0

# Shared location so the browsers installed here as root are usable by the `node` user.
# Without this they land in /root/.cache/ms-playwright and are invisible at runtime.
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

RUN npx --yes playwright@${PLAYWRIGHT_VERSION} install --with-deps chromium \
 && chmod -R a+rx /ms-playwright \
 && rm -rf /var/lib/apt/lists/* \
 && npm cache clean --force

# The gh and Claude Code config dirs are named volumes (see devcontainer.json). Docker seeds
# an empty volume from the image path, ownership included — so creating them as `node` here is
# what keeps the volumes writable. Without it they are root-owned and `gh auth login` fails.
RUN mkdir -p /home/node/.config/gh /home/node/.claude \
 && chown -R node:node /home/node/.config /home/node/.claude
