#!/usr/bin/env node
// Prints a fresh competition or problem id for each slug given:
//
//   npm run new-id -- hatszog-terulet online-c
//
// The format, and why the slug never changes once something refers to the id,
// is `ENTITY_ID_PATTERN` in packages/schemas/src/competition.ts; the generator
// is `newEntityId` beside it, which the admin page uses too. Node reads the
// TypeScript source as it is, without a build.

import { fileURLToPath } from 'node:url';
import { newEntityId } from '../packages/schemas/src/competition.ts';

export const newId = slug => newEntityId(slug);

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const slugs = process.argv.slice(2);
  if (slugs.length === 0) {
    console.error('Usage: npm run new-id -- <slug> [<slug>...]');
    process.exit(1);
  }
  for (const slug of slugs) console.log(newId(slug));
}
