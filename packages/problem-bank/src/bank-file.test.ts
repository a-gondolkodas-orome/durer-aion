import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { strategyGames } from 'game';
import { registry } from '../all';
import { bankFile, bankFromBundle } from './bank-file';
import type { Bundle } from './bundle';
import { bundleOf, readBundle } from './bundle';
import type { Bank } from './registry';
import { createRegistry, validateRegistry } from './registry';

const sample = readBundle(JSON.parse(readFileSync(join(__dirname, '..', 'fixtures', 'sample-bundle.json'), 'utf8')));
if ('errors' in sample) throw new Error(sample.errors.join('\n'));
// The sample as the export would write it: standing alone, with the
// reference problem its relay reuses.
const sampleCompetitions = Object.entries(sample.bundle.competitions).map(([id, body]) => ({ ...body, id }));
const everyProblem = new Map([
  ...registry.problems,
  ...Object.entries(sample.bundle.problems).map(([id, body]) => [id, { ...body, id }] as const),
]);
const sampleBundle = bundleOf(sampleCompetitions, everyProblem);

let directory: string;
beforeAll(() => { directory = mkdtempSync(join(tmpdir(), 'bank-file-')); });
afterAll(() => { rmSync(directory, { recursive: true, force: true }); });

/** What the file `bankFile` writes for `bank` exports, read back as a module. */
async function written(bank: Bank, name: string): Promise<Bank> {
  const path = join(directory, `${name}.ts`);
  writeFileSync(path, bankFile(bank));
  const { competitions, problems } = await import(path) as Bank;
  return { competitions, problems };
}

function held<T>(map: ReadonlyMap<string, T>, id: string): T {
  const found = map.get(id);
  if (found === undefined) throw new Error(`The registry has no ${id}`);
  return found;
}

/** Every bank of the registry as one, ids taken off again. */
const everyBank = (): Bank => ({
  problems: Object.fromEntries([...registry.problems].map(([id, { id: _, ...body }]) => [id, body])),
  competitions: Object.fromEntries([...registry.competitions].map(([id, { id: _, ...body }]) => [id, body])),
});

describe('bankFromBundle', () => {
  it('leaves out the problems the registry holds, so the bank registers beside it', async () => {
    const made = bankFromBundle(sampleBundle, registry);
    if ('errors' in made) throw new Error(made.errors.join('\n'));
    expect(made.leftOut).toEqual(['k5g58wuf6h--minta-korongok']);
    expect(Object.keys(made.bank.problems)).not.toContain('k5g58wuf6h--minta-korongok');

    const bank = await written(made.bank, 'sample');
    expect(bank).toEqual(made.bank);
    expect(validateRegistry(createRegistry([everyBank(), bank]), strategyGames)).toEqual([]);
  });

  // As admin.py exports a server's every competition, in-code ones too.
  it('leaves out the competitions the registry holds', () => {
    const reference = held(registry.competitions, 'klmgbpb334--minta-teljes');
    const made = bankFromBundle(bundleOf([reference, ...sampleCompetitions], everyProblem), registry);
    if ('errors' in made) throw new Error(made.errors.join('\n'));
    expect(made.leftOut).toContain('klmgbpb334--minta-teljes');
    expect(bankFromBundle(sampleBundle, registry)).toMatchObject({ bank: made.bank });
  });

  it('refuses a competition or a problem the registry holds in another form, and a bundle of in-code ones only', () => {
    const reference = bundleOf([held(registry.competitions, 'klmgbpb334--minta-teljes')], registry.problems);
    const changed: Bundle = {
      ...reference,
      competitions: { 'klmgbpb334--minta-teljes': { ...reference.competitions['klmgbpb334--minta-teljes'], languages: ['en'] } },
      problems: {
        ...reference.problems,
        'k5g58wuf6h--minta-korongok': { ...reference.problems['k5g58wuf6h--minta-korongok'], answer: 10 },
      },
    };
    expect(bankFromBundle(changed, registry)).toEqual({ errors: [
      'The competition klmgbpb334--minta-teljes is in code already, and differs from the bundle\'s',
      'The problem k5g58wuf6h--minta-korongok is in code already, and differs from the bundle\'s',
    ] });
    expect(bankFromBundle(reference, registry)).toEqual({ errors: ['Every competition of the bundle is in code already'] });
  });

  it('takes a problem the registry holds as the same whatever order its fields come in', () => {
    const { answer, content } = held(registry.problems, 'k5g58wuf6h--minta-korongok');
    const bundle: Bundle = { ...sampleBundle, problems: { 'k5g58wuf6h--minta-korongok': { content, answer } } };
    expect(bankFromBundle(bundle, registry)).toMatchObject({ leftOut: ['k5g58wuf6h--minta-korongok'] });
  });
});

describe('bankFile', () => {
  it('writes every bank held in code so that it reads back the same', async () => {
    const bank = everyBank();
    expect(await written(bank, 'every')).toEqual(bank);
  });

  it('writes a text with quotes, backslashes and line breaks so that it reads back the same', async () => {
    const texts = ['Ő \'idézett\'', 'both \' and "', '$\\frac{1}{2}$ \\\\ next', 'two\nlines\tand a tab'];
    const bank: Bank = {
      competitions: {},
      problems: Object.fromEntries(texts.map((problemText, index) =>
        [`aaaaaaaaa${index}--text`, { answer: index, content: { hu: { problemText } } }])),
    };
    expect(await written(bank, 'texts')).toEqual(bank);
  });

  it('writes a competition and a problem as the hand-written banks do', () => {
    const made = bankFromBundle(sampleBundle, registry);
    if ('errors' in made) throw new Error(made.errors.join('\n'));
    const source = bankFile(made.bank);
    expect(source).toContain("// Csomag: váltó, Csomag: teljes forduló: made from a bundle exported from the database,");
    expect(source).toContain([
      "  '903xajr9et--csomag-valto': {",
      "    languages: ['hu', 'en'],",
      '    relay: {',
      '      durationMinutes: 30,',
      '      problems: [',
      "        { problemId: '10iqp4vy6b--csomag-kockak', points: 3 },",
    ].join('\n'));
    expect(source).toContain([
      "  '7q1wniz55w--csomag-haromszog': {",
      '    answer: 180,',
      "    content: { hu: { problemText: 'Hány fok egy háromszög szögeinek összege?' } },",
      '  },',
    ].join('\n'));
  });
});
