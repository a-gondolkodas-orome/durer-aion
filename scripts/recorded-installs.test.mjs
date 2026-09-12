// Every `dev:*` script begins by asking whether the tree is installed, and
// `scripts/ensure-deps.mjs` answers from a stamp it writes after installs it
// performed itself. So a container that installs unconditionally has to say so
// afterwards, or the first dev script inside it deletes and reinstalls all 900
// packages before starting: that is what the compose dev backend did on every
// `stack:up` following an edit, since `COPY . .` gives each one an image, a
// container and a writable layer with no stamp in it.
//
// Asked of every image and dev container definition rather than of the three
// that had it, so a fourth is covered the day it lands. Workflows are left out:
// CI installs unconditionally too, and runs no `dev:*` script to pay for it.
import { globSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));

const DEFINITIONS = ['Dockerfile', '.devcontainer/**/*', 'apps/*/.devcontainer/**/*'];
const INSTALL = 'npm ci';
const RECORD = 'ensure-deps.mjs --record';

// Prose about `npm ci` is not an install — the READMEs beside these files
// describe the setup, and the comments inside them explain it — so the search
// is of what is left once both are gone. Every format here comments with `#`
// or `//`.
const code = (source) => source
  .split('\n')
  .filter((line) => !/^\s*(#|\/\/)/.test(line))
  .join('\n');

const definitions = DEFINITIONS
  .flatMap((pattern) => globSync(pattern, { cwd: repoRoot }))
  .map((path) => path.replaceAll('\\', '/'))
  .filter((path) => !path.endsWith('.md') && statSync(`${repoRoot}${path}`).isFile())
  .map((path) => ({ path, code: code(readFileSync(`${repoRoot}${path}`, 'utf8')) }));

describe('a container that installs the tree', () => {
  it('is looked for where they are defined, so an empty walk cannot pass', () => {
    expect(definitions.map((definition) => definition.path)).toStrictEqual(
      expect.arrayContaining([
        'Dockerfile',
        '.devcontainer/post-create.sh',
        'apps/strategy-practice/.devcontainer/devcontainer.json',
      ]),
    );
  });

  it('says so, rather than leaving the next dev script to install it again', () => {
    const silent = definitions
      .filter((definition) => definition.code.includes(INSTALL))
      .filter((definition) => !definition.code.includes(RECORD))
      .map((definition) => definition.path);

    expect(
      silent,
      `These run \`${INSTALL}\` and record nothing, so the first \`dev:*\` script in them takes `
      + `the tree for missing and installs all of it a second time:\n`
      + `${silent.map((path) => `  ${path}`).join('\n')}\n`
      + `Follow the install with \`node scripts/ensure-deps.mjs --record\`.`,
    ).toStrictEqual([]);
  });
});
