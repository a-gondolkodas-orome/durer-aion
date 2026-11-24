import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { strategyGames } from 'game';
import { banks } from '../all';
import { bankFile, bankFromBundle } from './bank-file';
import type { Bundle } from './bundle';
import { readBundle } from './bundle';
import type { Bank } from './registry';

const KORONGOK = 'k5g58wuf6h--minta-korongok';
const TELJES = 'klmgbpb334--minta-teljes';
const VALTO = '903xajr9et--csomag-valto';
const CSOMAG_TELJES = 'aqvco71pta--csomag-teljes';

// As the export writes it: its relay refers to KORONGOK, which the code holds.
const read = readBundle(JSON.parse(readFileSync(join(__dirname, '..', 'fixtures', 'sample-bundle.json'), 'utf8')));
if ('errors' in read) throw new Error(read.errors.join('\n'));
const sample = read.bundle;

function made(bundle: Bundle, ids: string[]) {
  const result = bankFromBundle(bundle, ids, banks, strategyGames);
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

  it('refuses a competition the code holds', () => {
    const bundle: Bundle = { ...sample, competitions: { ...sample.competitions, [TELJES]: sample.competitions[CSOMAG_TELJES] } };
    expect(bankFromBundle(bundle, [TELJES, VALTO], banks, strategyGames))
      .toEqual({ errors: [`Two banks hold the id ${TELJES}`] });
  });

  it('refuses a problem the code holds', () => {
    const bundle: Bundle = { ...sample, problems: { ...sample.problems, [KORONGOK]: sample.problems['10iqp4vy6b--csomag-kockak'] } };
    expect(bankFromBundle(bundle, [VALTO], banks, strategyGames))
      .toEqual({ errors: [`Two banks hold the id ${KORONGOK}`] });
  });

  // An id names one thing wherever it is read, a competition and a problem alike.
  it('refuses a competition whose id the code holds for a problem', () => {
    const bundle: Bundle = { ...sample, competitions: { [KORONGOK]: sample.competitions[VALTO] } };
    expect(bankFromBundle(bundle, [KORONGOK], banks, strategyGames))
      .toEqual({ errors: [expect.stringContaining(`${KORONGOK} egy feladat és egy verseny azonosítója is`)] });
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
    const result = bankFromBundle(bundle, [VALTO], banks, strategyGames);
    expect(result).toEqual({ errors: [
      expect.stringContaining('a váltó hossza (0) nem pozitív egész számú perc'),
      expect.stringContaining('(nnnnnnnnnn--nincs) nem létezik'),
    ] });
  });

  // Their relays share kockak, so the round's competitions are banked in one run.
  it('refuses a problem a bank made from the same bundle holds', () => {
    const first = made(sample, [VALTO]).bank;
    expect(bankFromBundle(sample, [CSOMAG_TELJES], [...banks, first], strategyGames))
      .toEqual({ errors: ['Two banks hold the id 10iqp4vy6b--csomag-kockak'] });
  });

  it('leaves out a clash among the competitions it is not given', () => {
    const bundle: Bundle = { ...sample, competitions: { ...sample.competitions, [TELJES]: sample.competitions[CSOMAG_TELJES] } };
    expect(Object.keys(made(bundle, [VALTO]).bank.competitions)).toEqual([VALTO]);
  });

  it('refuses no competition, and one the bundle does not hold', () => {
    expect(bankFromBundle(sample, [], banks, strategyGames)).toEqual({ errors: ['No competition is named'] });
    expect(bankFromBundle(sample, [VALTO, 'nnnnnnnnnn--nincs'], banks, strategyGames))
      .toEqual({ errors: ['The bundle holds no competition nnnnnnnnnn--nincs'] });
  });
});
