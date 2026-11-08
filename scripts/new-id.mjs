#!/usr/bin/env node
// Prints a fresh competition or problem id for each slug given:
//
//   npm run new-id -- hatszog-terulet online-c
//
// The format, and why the slug never changes once something refers to the id,
// is `ENTITY_ID_PATTERN` in packages/schemas/src/competition.ts.

import { randomInt } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function newId(slug) {
  if (!SLUG.test(slug)) {
    throw new Error(`"${slug}" is not a slug: lowercase ASCII letters and digits, single dashes between words`);
  }
  const random = Array.from({ length: 10 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
  return `${random}--${slug}`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const slugs = process.argv.slice(2);
  if (slugs.length === 0) {
    console.error('Usage: npm run new-id -- <slug> [<slug>...]');
    process.exit(1);
  }
  for (const slug of slugs) console.log(newId(slug));
}
