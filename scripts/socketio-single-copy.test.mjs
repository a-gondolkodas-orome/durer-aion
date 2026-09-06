// boardgame.io builds the socket layer every match runs on out of `koa-socket-2`, which asks for
// `socket.io ^3` — two majors below the one `apps/online-backend` declares. Without the `overrides`
// block in the root package.json npm nests a second copy under it, and that copy is what serves the
// traffic while the declared one is reached only by a type import (#461). Nothing above notices: a
// 4.x browser client and a 3.x server both speak Engine.IO 4, so the round works while the
// transport is type-checked against a version it is not running and `npm audit` reports on a tree
// nobody loads. This test is what makes that visible, since playing a round does not.
//
// Read out of the lockfile, not out of node_modules: the lockfile is what CI installs from, so a
// split shows up in review rather than on whichever machine happens to have the older tree.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const readJson = file => JSON.parse(readFileSync(`${repoRoot}${file}`, 'utf8'));

// Every place npm may put a package: hoisted at the root, or nested under whichever dependency
// pulled its own version in.
const installsOf = (lockfile, name) =>
  Object.entries(lockfile.packages)
    .filter(([path]) => path === `node_modules/${name}` || path.endsWith(`/node_modules/${name}`))
    .map(([path, entry]) => [path, entry.version]);

describe('the socket.io that serves the round', () => {
  const lockfile = readJson('package-lock.json');
  const installs = installsOf(lockfile, 'socket.io');
  const where = installs.map(([path, version]) => `  ${path} ${version}`).join('\n');

  it('is installed once', () => {
    expect(
      installs.length,
      `socket.io is installed more than once:\n${where}\n`
      + 'The nested copy is the one boardgame.io serves matches with. Point it at the declared '
      + 'version through the `overrides` block in the root package.json.'
    ).toBe(1);
  });

  it('is the version apps/online-backend declares', () => {
    const declared = readJson('apps/online-backend/package.json').dependencies['socket.io'];

    expect(installs.map(([, version]) => version), where).toStrictEqual([declared]);
  });
});
