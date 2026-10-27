// `up --wait`, which `stack:up` and `stack:prod` end on, waits for a healthcheck only where a
// service has one; without it a crash-looping container still reads as up.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

const compose = readFileSync(fileURLToPath(new URL('../../docker-compose.yml', import.meta.url)), 'utf8');

it.each(['web', 'backend', 'postgres'])('docker-compose.yml gives %s a healthcheck', (service) => {
  const block = new RegExp(`^ {2}${service}:\\n((?: {4}.*\\n|\\s*\\n)*)`, 'm').exec(compose)?.[1];
  expect(block).toMatch(/^ {4}healthcheck:/m);
});
