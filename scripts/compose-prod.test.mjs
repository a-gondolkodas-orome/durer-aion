// What is pinned is the file list, since a missing `-f` is what fails quietly:
// compose brings the stack up without that file and reports success.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { composeArgs } from './compose-prod.mjs';

const base = ['compose', '--env-file=.env.docker', '-f', 'docker-compose.yml'];

describe('composeArgs', () => {
  it('adds the TLS override after the base file when the host has one', () => {
    expect(composeArgs(['docker-compose.tls.yml'], ['up']))
      .toStrictEqual([...base, '-f', 'docker-compose.tls.yml', 'up']);
  });

  it('keeps docker-compose.override.yml, which compose drops once any -f is given', () => {
    expect(composeArgs(['docker-compose.tls.yml', 'docker-compose.override.yml'], ['up']))
      .toStrictEqual([...base, '-f', 'docker-compose.override.yml', '-f', 'docker-compose.tls.yml', 'up']);
  });

  it('runs the base file alone on a host without overrides', () => {
    expect(composeArgs([], ['ps'])).toStrictEqual([...base, 'ps']);
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
