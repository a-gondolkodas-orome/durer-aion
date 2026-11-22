#!/usr/bin/env node
// Writes packages/problem-bank/banks/<bank-name>.ts from the named
// competitions of an exported bundle, and prints the lines that register it:
//
//   npm run bank:from-bundle -- <bundle.json> <bank-name> <competition id>...
//
// README § In the database, and back into code says when to run it.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bankFile, bankFromBundle, readBundle } from 'problem-bank';
import { registry } from 'problem-bank/all';

const BANKS = fileURLToPath(new URL('../packages/problem-bank/banks/', import.meta.url));
// A file name that is also an identifier once camel-cased, as the banks' are.
const NAME = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/// The name the registries import the bank `name` as: edition-21-online is
/// edition21Online.
function importName(name) {
  return name.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase());
}

/// Writes the bank the competitions `ids` of the bundle at `bundlePath` make
/// to `<directory>/<name>.ts`, and returns its path with what registers it,
/// as text to print.
export function writeBank(bundlePath, name, ids, directory = BANKS) {
  if (!NAME.test(name)) {
    throw new Error(`"${name}" is no bank name: lowercase ASCII letters and digits, single dashes between words, a letter first`);
  }
  const path = join(directory, `${name}.ts`);
  if (existsSync(path)) throw new Error(`${path} exists already`);
  const read = readBundle(JSON.parse(readFileSync(bundlePath, 'utf8')));
  if ('errors' in read) throw new Error(read.errors.join('\n'));
  const made = bankFromBundle(read.bundle, ids, registry);
  if ('errors' in made) {
    const held = Object.keys(read.bundle.competitions).map(id => `  ${id}`);
    throw new Error([...made.errors, 'The bundle holds the competitions', ...held].join('\n'));
  }
  writeFileSync(path, bankFile(made.bank));

  const as = importName(name);
  const competitions = Object.entries(made.bank.competitions);
  // The practice site lists relays only, and throws on any other competition.
  const listed = competitions.filter(([, competition]) => competition.relay !== undefined).map(([id]) => id);
  const unlisted = competitions.filter(([, competition]) => competition.relay === undefined).map(([id]) => id);
  return [
    `Wrote ${path}: ${competitions.length} competitions, ${Object.keys(made.bank.problems).length} problems.`,
    '',
    'Register it in packages/problem-bank/all.ts, which the live round serves:',
    `  import * as ${as} from './banks/${name}';`,
    `  ${as},  (in the createRegistry list)`,
    '',
    'To list it on the relay practice site once it is released, in apps/relay-practise-frontend/src/practice-sets.ts:',
    `  import * as ${as} from "problem-bank/banks/${name}";`,
    `  ${as},  (in the createRegistry list)`,
    ...listed.map(id => `  "${id}",  (in listedIds)`),
    ...unlisted.length > 0 ? [`Not in listedIds, having no relay: ${unlisted.join(', ')}`] : [],
  ].join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [bundlePath, name, ...ids] = process.argv.slice(2);
  if (bundlePath === undefined || name === undefined) {
    console.error('Usage: npm run bank:from-bundle -- <bundle.json> <bank-name> <competition id>...');
    process.exit(1);
  }
  try {
    console.log(writeBank(bundlePath, name, ids));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
