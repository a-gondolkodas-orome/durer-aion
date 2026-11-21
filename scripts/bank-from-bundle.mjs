#!/usr/bin/env node
// Writes packages/problem-bank/banks/<bank-name>.ts from an exported bundle,
// and prints the lines that register it:
//
//   npm run bank:from-bundle -- <bundle.json> <bank-name>
//
// README § In the database, and back into code says when to run it.

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bankFile, bankFromBundle, problemsReferredFrom, readBundle } from 'problem-bank';
import { registry } from 'problem-bank/all';

const BANKS = fileURLToPath(new URL('../packages/problem-bank/banks/', import.meta.url));
// A file name that is also an identifier once camel-cased, as the banks' are.
const NAME = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/// The name the registries import the bank `name` as: edition-21-online is
/// edition21Online.
function importName(name) {
  return name.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase());
}

/// The names of the banks under banks/ but `written` that hold any of the
/// problems `ids`.
async function banksHolding(ids, written) {
  const names = readdirSync(BANKS).filter(file => file.endsWith('.ts')).map(file => file.slice(0, -'.ts'.length))
    .filter(name => name !== written);
  const holding = await Promise.all(names.map(async (name) => {
    // A specifier built at run time, which Vite must not try to resolve ahead.
    const { problems } = await import(/* @vite-ignore */ `problem-bank/banks/${name}`);
    return ids.some(id => id in problems) ? [name] : [];
  }));
  return holding.flat();
}

/// Writes the bank the bundle at `bundlePath` makes to `<banks>/<name>.ts`,
/// and returns its path with what registers it, as text to print. `banks` is
/// only where the file goes: the banks it reuses problems of are looked up in
/// the real banks/ whatever it is.
export async function writeBank(bundlePath, name, banks = BANKS) {
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
  // A site registers only the banks it names, so one that lists this bank's
  // competitions must name the banks holding the problems it refers to.
  const others = await banksHolding(problemsReferredFrom(read.bundle), name);
  return [
    `Wrote ${path}: ${ids.length} competitions, ${Object.keys(made.bank.problems).length} problems.`,
    '',
    'Register it in packages/problem-bank/all.ts, which the live round serves:',
    `  import * as ${as} from './banks/${name}';`,
    `  ${as},  (in the banks list)`,
    '',
    'To list it on the relay practice site once it is released, in apps/relay-practise-frontend/src/practice-sets.ts:',
    `  import * as ${as} from "problem-bank/banks/${name}";`,
    `  ${as},  (in the createRegistry list)`,
    ...ids.map(id => `  "${id}",  (in listedIds)`),
    ...(others.length > 0
      ? ['', `Its relays use problems of ${others.join(', ')}, which practice-sets.ts must register too.`]
      : []),
  ].join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [bundlePath, name, ...rest] = process.argv.slice(2);
  if (bundlePath === undefined || name === undefined || rest.length > 0) {
    console.error('Usage: npm run bank:from-bundle -- <bundle.json> <bank-name>');
    process.exit(1);
  }
  try {
    console.log(await writeBank(bundlePath, name));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
