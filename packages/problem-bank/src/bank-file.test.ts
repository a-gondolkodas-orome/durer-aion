import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { strategyGames } from 'game';
import { registry } from '../all';
import { bankFile, bankFromBundle } from './bank-file';
import type { Bundle } from './bundle';
import { bundleOf, readBundle } from './bundle';
import { inCode } from './in-code-for-testing';
import type { Bank } from './registry';
import { createRegistry, validateRegistry } from './registry';

const KORONGOK = 'k5g58wuf6h--minta-korongok';
const TELJES = 'klmgbpb334--minta-teljes';

const sample = readBundle(JSON.parse(readFileSync(join(__dirname, '..', 'fixtures', 'sample-bundle.json'), 'utf8')));
if ('errors' in sample) throw new Error(sample.errors.join('\n'));
// A reference competition with its problems, as the export writes it.
const reference = bundleOf([inCode(registry.competitions, TELJES)], registry.problems);
const korongok = reference.problems[KORONGOK];
// The sample as the export writes it: with the reference problem its relay reuses.
const sampleBundle: Bundle = { ...sample.bundle, problems: { ...sample.bundle.problems, [KORONGOK]: korongok } };

function made(bundle: Bundle) {
  const result = bankFromBundle(bundle, registry);
  if ('errors' in result) throw new Error(result.errors.join('\n'));
  return result;
}

/** Every bank of the registry as one, ids taken off again. */
const everyBank = (): Bank => ({
  problems: Object.fromEntries([...registry.problems].map(([id, { id: _, ...body }]) => [id, body])),
  competitions: Object.fromEntries([...registry.competitions].map(([id, { id: _, ...body }]) => [id, body])),
});

describe('bankFromBundle', () => {
  let directory: string;
  beforeAll(() => { directory = mkdtempSync(join(tmpdir(), 'bank-file-')); });
  afterAll(() => { rmSync(directory, { recursive: true, force: true }); });

  it('leaves out the problems the registry holds, and makes a file that registers beside it', async () => {
    const { bank, leftOut } = made(sampleBundle);
    expect(leftOut).toEqual([KORONGOK]);
    expect(Object.keys(bank.problems)).not.toContain(KORONGOK);

    const path = join(directory, 'sample.ts');
    writeFileSync(path, bankFile(bank));
    const { competitions, problems } = await import(path) as Bank;
    expect({ competitions, problems }).toEqual(bank);
    expect(validateRegistry(createRegistry([everyBank(), bank]), strategyGames)).toEqual([]);
  });

  // As admin.py exports a server's every competition, in-code ones too.
  it('leaves out the competitions the registry holds', () => {
    const both: Bundle = {
      ...sampleBundle,
      competitions: { ...reference.competitions, ...sampleBundle.competitions },
      problems: { ...reference.problems, ...sampleBundle.problems },
    };
    const { bank, leftOut } = made(both);
    expect(leftOut).toContain(TELJES);
    expect(bank).toEqual(made(sampleBundle).bank);
  });

  it('refuses a competition or a problem the registry holds in another form, and a bundle of in-code ones only', () => {
    const changed: Bundle = {
      ...reference,
      competitions: { [TELJES]: { ...reference.competitions[TELJES], languages: ['en'] } },
      problems: { ...reference.problems, [KORONGOK]: { ...korongok, answer: 10 } },
    };
    expect(bankFromBundle(changed, registry)).toEqual({ errors: [
      `The competition ${TELJES} is in code already, and differs from the bundle's`,
      `The problem ${KORONGOK} is in code already, and differs from the bundle's`,
    ] });
    expect(bankFromBundle(reference, registry)).toEqual({ errors: ['Every competition of the bundle is in code already'] });
  });

  it('takes a problem the registry holds as the same whatever order its fields come in', () => {
    const { answer, content } = korongok;
    const bundle: Bundle = { ...sampleBundle, problems: { [KORONGOK]: { content, answer } } };
    expect(made(bundle).leftOut).toEqual([KORONGOK]);
  });
});

describe('bankFile', () => {
  it('names the competitions in the file\'s comment', () => {
    expect(bankFile(made(sampleBundle).bank))
      .toContain('// Csomag: váltó, Csomag: teljes forduló: made from a bundle exported from the database,');
  });
});
