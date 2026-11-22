import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { strategyGames } from 'game';
import { registry } from '../all';
import { bankFile, bankFromBundle } from './bank-file';
import type { Bundle } from './bundle';
import { readBundle } from './bundle';
import type { Bank } from './registry';
import type { ProblemBank } from './sources';
import { createRegistry } from './registry';

const KORONGOK = 'k5g58wuf6h--minta-korongok';
const TELJES = 'klmgbpb334--minta-teljes';
const VALTO = '903xajr9et--csomag-valto';
const CSOMAG_TELJES = 'aqvco71pta--csomag-teljes';

// As the export writes it: its relay refers to KORONGOK, which the code holds.
const read = readBundle(JSON.parse(readFileSync(join(__dirname, '..', 'fixtures', 'sample-bundle.json'), 'utf8')));
if ('errors' in read) throw new Error(read.errors.join('\n'));
const sample = read.bundle;

// Every bank of all.ts as one, to register a new bank beside.
const inCode: Bank = {
  competitions: Object.fromEntries(registry.competitions),
  problems: Object.fromEntries(registry.problems),
};

function made(bundle: Bundle, ids: string[]) {
  const result = bankFromBundle(bundle, ids, registry, strategyGames);
  if ('errors' in result) throw new Error(result.errors.join('\n'));
  return result;
}

describe('bankFromBundle', () => {
  let directory: string;
  beforeAll(() => { directory = mkdtempSync(join(tmpdir(), 'bank-file-')); });
  afterAll(() => { rmSync(directory, { recursive: true, force: true }); });

  it('makes a file that registers beside the banks', async () => {
    const { bank } = made(sample, [VALTO, CSOMAG_TELJES]);
    expect(bank).toEqual({ competitions: sample.competitions, problems: sample.problems });

    const path = join(directory, 'sample.ts');
    writeFileSync(path, bankFile(bank));
    const { competitions, problems } = await import(path) as Bank;
    expect({ competitions, problems }).toEqual(bank);
  });

  it('takes the named competitions, and only the problems their relays use', () => {
    const { bank } = made(sample, [VALTO]);
    expect(Object.keys(bank.competitions)).toEqual([VALTO]);
    // roow9oo75t--csomag-paros is the other competition's alone.
    expect(Object.keys(bank.problems).sort()).toEqual(['10iqp4vy6b--csomag-kockak', '7q1wniz55w--csomag-haromszog']);
  });

  it('refuses a competition the registry holds, and a problem it holds otherwise', () => {
    const bundle: Bundle = {
      ...sample,
      competitions: { ...sample.competitions, [TELJES]: sample.competitions[CSOMAG_TELJES] },
      problems: { ...sample.problems, [KORONGOK]: sample.problems['10iqp4vy6b--csomag-kockak'] },
    };
    expect(bankFromBundle(bundle, [TELJES, VALTO], registry, strategyGames)).toEqual({ errors: [
      `The competition ${TELJES} is in code already`,
      `The problem ${KORONGOK} is in code already, and differs there`,
    ] });
  });

  // The export does not validate, so the rules are first applied here.
  it('refuses what the rules refuse, a relay problem neither holds included', () => {
    const relay = sample.competitions[VALTO].relay;
    if (relay === undefined) throw new Error('The sample bundle has changed');
    const bundle: Bundle = {
      ...sample,
      competitions: {
        ...sample.competitions,
        [VALTO]: {
          ...sample.competitions[VALTO],
          relay: { ...relay, durationMinutes: 0, problems: [...relay.problems, { problemId: 'nnnnnnnnnn--nincs', points: 1 }] },
        },
      },
    };
    const result = bankFromBundle(bundle, [VALTO], registry, strategyGames);
    expect(result).toEqual({ errors: [
      expect.stringContaining('a váltó hossza (0) nem pozitív egész számú perc'),
      expect.stringContaining('(nnnnnnnnnn--nincs) nem létezik'),
    ] });
  });

  // The second competition's relay shares kockak with the first's, banked
  // already, and with its keys in another order, as jsonb may store them.
  it('leaves to the registry a problem it holds as the bundle does', () => {
    const banked = made(sample, [VALTO]).bank;
    const kockak = Object.fromEntries(Object.entries(banked.problems['10iqp4vy6b--csomag-kockak']).reverse()) as ProblemBank[string];
    const first: Bank = { ...banked, problems: { ...banked.problems, '10iqp4vy6b--csomag-kockak': kockak } };
    const { bank } = made(sample, [CSOMAG_TELJES]);
    const second = bankFromBundle(sample, [CSOMAG_TELJES], createRegistry([inCode, first]), strategyGames);
    expect(second).toEqual({
      bank: { competitions: bank.competitions, problems: { 'roow9oo75t--csomag-paros': bank.problems['roow9oo75t--csomag-paros'] } },
    });
  });

  it('leaves out a clash among the competitions it is not given', () => {
    const bundle: Bundle = { ...sample, competitions: { ...sample.competitions, [TELJES]: sample.competitions[CSOMAG_TELJES] } };
    expect(Object.keys(made(bundle, [VALTO]).bank.competitions)).toEqual([VALTO]);
  });

  it('refuses no competition, and one the bundle does not hold', () => {
    expect(bankFromBundle(sample, [], registry, strategyGames)).toEqual({ errors: ['No competition is named'] });
    expect(bankFromBundle(sample, [VALTO, 'nnnnnnnnnn--nincs'], registry, strategyGames))
      .toEqual({ errors: ['The bundle holds no competition nnnnnnnnnn--nincs'] });
  });
});

describe('bankFile', () => {
  it('names the competitions in the file\'s comment', () => {
    expect(bankFile(made(sample, [VALTO, CSOMAG_TELJES]).bank))
      .toContain('// Csomag: váltó, Csomag: teljes forduló: made from a bundle exported from the database,');
  });
});
