// The dev overlay starts the backend with an npm script, and every `dev:*` script
// begins by making sure the tree is installed. In a container that is the wrong
// question: the image installed it at build, and the record of that install lives
// in node_modules in a writable layer that `stack:up --build` throws away on any
// edit — so the check found nothing every time and reinstalled ~900 packages
// before the server started.
//
// Checked per service rather than for the one that had it, so a second service
// started the same way is covered the day it lands.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const read = name => readFileSync(`${repoRoot}${name}`, 'utf8');

const COMPOSE = 'docker-compose.dev.yml';
const SKIP_DEPS = 'DURER_SKIP_DEPS=1';

/**
 * The services of a compose file, each with the `command:` it overrides and the
 * `environment:` list it sets. Two levels of a small, flat file, read by indent:
 * a parser would be a dependency for four lines of scanning.
 */
function servicesOf(source) {
  const lines = source.split('\n');
  const services = {};
  let current = null;
  let inEnvironment = false;

  for (const line of lines) {
    if (/^ {2}[A-Za-z][\w-]*:\s*$/.test(line)) {
      current = { name: line.trim().slice(0, -1), command: null, environment: [] };
      services[current.name] = current;
      inEnvironment = false;
      continue;
    }
    if (current === null) continue;

    const command = /^ {4}command:\s*(.+?)\s*$/.exec(line);
    if (command) { current.command = command[1]; inEnvironment = false; continue; }

    if (/^ {4}environment:\s*$/.test(line)) { inEnvironment = true; continue; }
    if (/^ {4}\S/.test(line)) { inEnvironment = false; continue; }

    const item = /^ {6}- (.+?)\s*$/.exec(line);
    if (inEnvironment && item) current.environment.push(item[1]);
  }
  return Object.values(services);
}

const rootScripts = () => JSON.parse(read('package.json')).scripts ?? {};

/** Whether an npm script reaches the install check on its way to the server. */
const checksTheTree = command => {
  const script = /^npm run ([\w:-]+)$/.exec(command ?? '');
  if (script === null) return false;
  return (rootScripts()[script[1]] ?? '').includes('scripts/prepare.mjs');
};

describe('the dev overlay', () => {
  const services = servicesOf(read(COMPOSE));

  it('is read at all, so a broken walk cannot pass by finding nothing', () => {
    expect(services.map(service => service.name)).toContain('backend');
    expect(services.find(service => service.name === 'backend')?.command).toBe('npm run dev:server');
  });

  // The check is what `prepare.mjs` does first, and `dev:server` is what the
  // overlay runs — if that ever stops being true this test is asking about
  // nothing, and should be removed rather than left passing.
  it('starts the backend with a script that would check the tree', () => {
    expect(checksTheTree('npm run dev:server')).toBe(true);
  });

  it('tells every such service that the image already installed it', () => {
    const reinstalling = services
      .filter(service => checksTheTree(service.command))
      .filter(service => !service.environment.includes(SKIP_DEPS))
      .map(service => service.name);

    expect(
      reinstalling,
      `These start with a script that installs the tree if nothing has recorded one, and nothing `
      + `in a container has: they will delete and refetch every package on each start.\n`
      + `${reinstalling.map(name => `  ${name}`).join('\n')}\n`
      + `Set ${SKIP_DEPS} in the service's environment — ${COMPOSE} says why.`
    ).toStrictEqual([]);
  });
});
