// What is pinned is the file list, since a missing `-f` is what fails quietly:
// compose brings `web` up without port 443 and reports success.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { composeArgs, TLS_OVERRIDE } from './compose-prod.mjs';

describe('composeArgs', () => {
  it('adds the TLS override after the base file when the host has one', () => {
    expect(composeArgs(true, ['up'])).toStrictEqual([
      'compose', '--env-file=.env.docker', '-f', 'docker-compose.yml', '-f', TLS_OVERRIDE, 'up',
    ]);
  });

  it('runs the base file alone on a host without TLS', () => {
    expect(composeArgs(false, ['ps'])).toStrictEqual([
      'compose', '--env-file=.env.docker', '-f', 'docker-compose.yml', 'ps',
    ]);
  });
});

describe('the stack:prod scripts', () => {
  const scripts = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).scripts;

  it('call compose only through the wrapper, which is what keeps the override in', () => {
    const prod = Object.entries(scripts).filter(([name]) => name.startsWith('stack:prod'));
    expect(prod.length).toBeGreaterThan(1);
    for (const [name, command] of prod) {
      expect(command, name).toContain('node scripts/compose-prod.mjs');
      expect(command, name).not.toContain('docker compose');
    }
  });
});
