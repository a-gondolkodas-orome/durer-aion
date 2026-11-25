#!/usr/bin/env node
// Writes banks/<bank-name>.ts from the named competitions of an exported
// bundle, and prints the lines that register it:
//
//   npm run bank:from-bundle -- <bundle.json> <bank-name> <competition id>...
//
// README § In the database, and back into code says when to run it. It checks
// none of the rules: registered, the bank is validated as every bank is, by
// the registry suite and the server at start. So Node runs it as it is,
// stripping its types, and it imports nothing at run time but Node's own.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CompetitionId } from 'schemas';
import type { Bundle } from './bundle';
import type { Bank } from './registry';
import type { CompetitionBank } from './sources';

const BANKS = fileURLToPath(new URL('../banks/', import.meta.url));
// A file name that is also an identifier once camel-cased, as the banks' are.
const NAME = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/// The bank of the competitions `ids` of `bundle`, with the bundle's problems
/// their relays use and no other, or why it makes none. A problem two of a
/// round's competitions share goes into the one bank, so name them together.
export function bankFromBundle(bundle: Bundle, ids: readonly CompetitionId[]): { bank: Bank } | { errors: string[] } {
  if (ids.length === 0) return { errors: ['No competition is named'] };
  const missing = ids.filter(id => !(id in bundle.competitions));
  if (missing.length > 0) {
    return { errors: missing.map(id => `The bundle holds no competition ${id}`) };
  }
  const competitions: CompetitionBank = Object.fromEntries(ids.map(id => [id, bundle.competitions[id]]));
  const used = new Set(Object.values(competitions)
    .flatMap(competition => competition.relay?.problems.map(({ problemId }) => problemId) ?? []));
  return { bank: { competitions, problems: Object.fromEntries(Object.entries(bundle.problems).filter(([id]) => used.has(id))) } };
}

/// The source of a file under banks/ that exports `bank`. The literals are
/// JSON: valid TypeScript, which the banks' ESLint rules pass as it is.
export function bankFile(bank: Bank): string {
  return [
    "import type { CompetitionBank, ProblemBank } from '../src/sources';",
    '',
    '// TODO: which round this is, as the other banks say.',
    '',
    `export const competitions: CompetitionBank = ${JSON.stringify(bank.competitions, null, 2)};`,
    '',
    `export const problems: ProblemBank = ${JSON.stringify(bank.problems, null, 2)};`,
    '',
  ].join('\n');
}

/// The name the registries import the bank `name` as: edition-21-online is
/// edition21Online.
function importName(name: string): string {
  return name.replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase());
}

/// Writes the bank the competitions `ids` of the bundle at `bundlePath` make
/// to `<directory>/<name>.ts`, and returns its path with what registers it,
/// as text to print.
export function writeBank(bundlePath: string, name: string, ids: readonly CompetitionId[], directory = BANKS): string {
  if (!NAME.test(name)) {
    throw new Error(`"${name}" is no bank name: lowercase ASCII letters and digits, single dashes between words, a letter first`);
  }
  const path = join(directory, `${name}.ts`);
  if (existsSync(path)) throw new Error(`${path} exists already`);
  const bundle = JSON.parse(readFileSync(bundlePath, 'utf8')) as Bundle;
  if (bundle.format !== 'durer-competitions') throw new Error(`${bundlePath} is no exported bundle`);
  const made = bankFromBundle(bundle, ids);
  if ('errors' in made) {
    const held = Object.keys(bundle.competitions).map(id => `  ${id}`);
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
    `  ${as},  (in the banks list)`,
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
