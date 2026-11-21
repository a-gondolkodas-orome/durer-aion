import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { strategyGames } from 'game';
import { banks, registry } from '../all';
import { bankFile, bankFromBundle } from './bank-file';
import type { Bundle } from './bundle';
import { bundleOf, readBundle } from './bundle';
import type { Bank } from './registry';
import { createRegistry, validateRegistry } from './registry';

const KORONGOK = 'k5g58wuf6h--minta-korongok';
const TELJES = 'klmgbpb334--minta-teljes';

// As the export writes it: its relay refers to KORONGOK, which the code holds.
const read = readBundle(JSON.parse(readFileSync(join(__dirname, '..', 'fixtures', 'sample-bundle.json'), 'utf8')));
if ('errors' in read) throw new Error(read.errors.join('\n'));
const sample = read.bundle;

function made(bundle: Bundle) {
  const result = bankFromBundle(bundle, registry);
  if ('errors' in result) throw new Error(result.errors.join('\n'));
  return result.bank;
}

describe('bankFromBundle', () => {
  let directory: string;
  beforeAll(() => { directory = mkdtempSync(join(tmpdir(), 'bank-file-')); });
  afterAll(() => { rmSync(directory, { recursive: true, force: true }); });

  it('makes a file that registers beside the banks', async () => {
    const bank = made(sample);
    expect(bank).toEqual({ competitions: sample.competitions, problems: sample.problems });

    const path = join(directory, 'sample.ts');
    writeFileSync(path, bankFile(bank));
    const { competitions, problems } = await import(path) as Bank;
    expect({ competitions, problems }).toEqual(bank);
    expect(validateRegistry(createRegistry([...banks, bank]), strategyGames)).toEqual([]);
  });

  it('refuses an id the registry holds, and a relay problem neither holds', () => {
    const inCode = bundleOf([TELJES].flatMap(id => registry.competitions.get(id) ?? []), registry.problems);
    const relay = sample.competitions['903xajr9et--csomag-valto'].relay;
    if (relay === undefined) throw new Error('The sample bundle has changed');
    const bundle: Bundle = {
      ...sample,
      competitions: {
        ...sample.competitions,
        ...inCode.competitions,
        '903xajr9et--csomag-valto': {
          ...sample.competitions['903xajr9et--csomag-valto'],
          relay: { ...relay, problems: [...relay.problems, { problemId: 'nnnnnnnnnn--nincs', points: 1 }] },
        },
      },
      problems: { ...sample.problems, [KORONGOK]: inCode.problems[KORONGOK] },
    };
    expect(bankFromBundle(bundle, registry)).toEqual({ errors: [
      `The competition ${TELJES} is in code already`,
      `The problem ${KORONGOK} is in code already`,
      'A relay uses the problem nnnnnnnnnn--nincs, which neither the bundle nor the code holds',
    ] });
  });

  it('refuses a bundle with no competition', () => {
    expect(bankFromBundle({ ...sample, competitions: {} }, registry))
      .toEqual({ errors: ['The bundle holds no competition'] });
  });
});

describe('bankFile', () => {
  it('names the competitions in the file\'s comment', () => {
    expect(bankFile(made(sample)))
      .toContain('// Csomag: váltó, Csomag: teljes forduló: made from a bundle exported from the database,');
  });
});
