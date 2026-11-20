#!/usr/bin/env node
// Writes the bank file a bundle exported from the admin page makes, and prints
// the lines that register it:
//
//   npm run bank:from-bundle -- <bundle.json> <bank-name>
//
// writes packages/problem-bank/banks/<bank-name>.ts. The competitions and
// problems the banks already hold are left out of it (`bankFromBundle`). README § Adding a
// competition says when to run it, and what to do with the database's copy.

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
export function importName(name) {
  return name.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase());
}

/// Writes the bank the bundle at `bundlePath` makes to `<banks>/<name>.ts`,
/// and returns its path with what registers it, as text to print.
export function writeBank(bundlePath, name, banks = BANKS) {
  if (!NAME.test(name)) {
    throw new Error(`"${name}" is no bank name: lowercase ASCII letters and digits, single dashes between words, a letter first`);
  }
  const path = join(banks, `${name}.ts`);
  if (existsSync(path)) throw new Error(`${path} exists already`);
  const read = readBundle(JSON.parse(readFileSync(bundlePath, 'utf8')));
  if ('errors' in read) throw new Error(read.errors.join('\n'));
  const made = bankFromBundle(read.bundle, registry);
  if ('errors' in made) throw new Error(made.errors.join('\n'));
  writeFileSync(path, bankFile(made.bank));

  const as = importName(name);
  const ids = Object.keys(made.bank.competitions);
  return [
    `Wrote ${path}: ${ids.length} competitions, ${Object.keys(made.bank.problems).length} problems`
      + (made.leftOut.length > 0 ? `, leaving out ${made.leftOut.length} competitions and problems that other banks hold.` : '.'),
    '',
    'Register it in packages/problem-bank/all.ts, which the live round serves:',
    `  import * as ${as} from './banks/${name}';`,
    `  ${as},  (in the createRegistry list)`,
    '',
    'To list it on the relay practice site once it is released, in apps/relay-practise-frontend/src/practice-sets.ts:',
    `  import * as ${as} from "problem-bank/banks/${name}";`,
    `  ${as},  (in the createRegistry list)`,
    ...ids.map(id => `  "${id}",  (in listedIds)`),
  ].join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [bundlePath, name, ...rest] = process.argv.slice(2);
  if (bundlePath === undefined || name === undefined || rest.length > 0) {
    console.error('Usage: npm run bank:from-bundle -- <bundle.json> <bank-name>');
    process.exit(1);
  }
  try {
    console.log(writeBank(bundlePath, name));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
