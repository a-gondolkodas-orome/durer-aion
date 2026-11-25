import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { strategyGames } from 'game';
import { banks } from '../all';
import type { Bundle } from './bundle';
import { readBundle } from './bundle';
import { bankFile, bankFromBundle, writeBank } from './bank-from-bundle';
import type { Bank } from './registry';

const KORONGOK = 'k5g58wuf6h--minta-korongok';
const MINTA_TELJES = 'klmgbpb334--minta-teljes';
const VALTO = '903xajr9et--csomag-valto';
const TELJES = 'aqvco71pta--csomag-teljes';

// As the export writes it: its relay refers to KORONGOK, which the code holds.
const sample = readFileSync(join(__dirname, '..', 'fixtures', 'sample-bundle.json'), 'utf8');
const read = readBundle(JSON.parse(sample));
if ('errors' in read) throw new Error(read.errors.join('\n'));
const bundled = read.bundle;

function made(bundle: Bundle, ids: string[]) {
  const result = bankFromBundle(bundle, ids, banks, strategyGames);
  if ('errors' in result) throw new Error(result.errors.join('\n'));
  return result;
}

let directory: string;
let bundlePath: string;
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'bank-from-bundle-'));
  bundlePath = join(directory, 'bundle.json');
  writeFileSync(bundlePath, sample);
});
afterEach(() => { rmSync(directory, { recursive: true, force: true }); });

function withBundle(change: (bundle: Bundle) => void) {
  const bundle = JSON.parse(sample) as Bundle;
  change(bundle);
  writeFileSync(bundlePath, JSON.stringify(bundle));
}

describe('bank-from-bundle.ts', () => {
  it('writes the named competitions\' bank, and prints what registers it', () => {
    const printed = writeBank(bundlePath, 'csomag-proba', [VALTO], directory);

    const written = readFileSync(join(directory, 'csomag-proba.ts'), 'utf8');
    expect(written).toContain(`"${VALTO}": {`);
    expect(written).not.toContain(TELJES);
    expect(printed).toContain("  import * as csomagProba from './banks/csomag-proba';");
    expect(printed).toContain(`  "${VALTO}",  (in listedIds)`);
  });

  // practice-sets.ts throws on a listed competition with no relay.
  it('lists only the competitions with a relay', () => {
    withBundle(bundle => { delete bundle.competitions[TELJES].relay; });
    const printed = writeBank(bundlePath, 'csomag-proba', [VALTO, TELJES], directory);
    expect(printed).not.toContain(`"${TELJES}",  (in listedIds)`);
    expect(printed).toContain(`Not in listedIds, having no relay: ${TELJES}`);
  });

  it('refuses to write over a bank', () => {
    writeFileSync(join(directory, 'taken.ts'), '');
    expect(() => writeBank(bundlePath, 'taken', [VALTO], directory)).toThrow('exists already');
  });

  it('writes nothing for a bundle it refuses, and names the competitions it holds', () => {
    withBundle(bundle => { bundle.competitions[MINTA_TELJES] = bundle.competitions[TELJES]; });
    expect(() => writeBank(bundlePath, 'clash', [MINTA_TELJES], directory))
      .toThrow(`Two banks hold the id ${MINTA_TELJES}\nThe bundle holds the competitions\n  ${VALTO}`);
    expect(existsSync(join(directory, 'clash.ts'))).toBe(false);
  });

  it.each(['Edition', '21-online', 'a--b', 'a_b', ''])('refuses the bank name "%s"', (name) => {
    expect(() => writeBank('unread.json', name, [VALTO], directory)).toThrow('no bank name');
  });
});

describe('bankFromBundle', () => {
  let directory: string;
  beforeAll(() => { directory = mkdtempSync(join(tmpdir(), 'bank-file-')); });
  afterAll(() => { rmSync(directory, { recursive: true, force: true }); });

  it('makes a file that registers beside the banks', async () => {
    const { bank } = made(bundled, [VALTO, TELJES]);
    expect(bank).toEqual({ competitions: bundled.competitions, problems: bundled.problems });

    const path = join(directory, 'sample.ts');
    writeFileSync(path, bankFile(bank));
    const { competitions, problems } = await import(path) as Bank;
    expect({ competitions, problems }).toEqual(bank);
  });

  it('takes the named competitions, and only the problems their relays use', () => {
    const { bank } = made(bundled, [VALTO]);
    expect(Object.keys(bank.competitions)).toEqual([VALTO]);
    // roow9oo75t--csomag-paros is the other competition's alone.
    expect(Object.keys(bank.problems).sort()).toEqual(['10iqp4vy6b--csomag-kockak', '7q1wniz55w--csomag-haromszog']);
  });

  it('refuses a competition the code holds', () => {
    const bundle: Bundle = { ...bundled, competitions: { ...bundled.competitions, [MINTA_TELJES]: bundled.competitions[TELJES] } };
    expect(bankFromBundle(bundle, [MINTA_TELJES, VALTO], banks, strategyGames))
      .toEqual({ errors: [`Two banks hold the id ${MINTA_TELJES}`] });
  });

  it('refuses a problem the code holds', () => {
    const bundle: Bundle = { ...bundled, problems: { ...bundled.problems, [KORONGOK]: bundled.problems['10iqp4vy6b--csomag-kockak'] } };
    expect(bankFromBundle(bundle, [VALTO], banks, strategyGames))
      .toEqual({ errors: [`Two banks hold the id ${KORONGOK}`] });
  });

  // An id names one thing wherever it is read, a competition and a problem alike.
  it('refuses a competition whose id the code holds for a problem', () => {
    const bundle: Bundle = { ...bundled, competitions: { [KORONGOK]: bundled.competitions[VALTO] } };
    expect(bankFromBundle(bundle, [KORONGOK], banks, strategyGames))
      .toEqual({ errors: [expect.stringContaining(`${KORONGOK} egy feladat és egy verseny azonosítója is`)] });
  });

  // The export does not validate, so the rules are first applied here.
  it('refuses what the rules refuse, a relay problem neither holds included', () => {
    const relay = bundled.competitions[VALTO].relay;
    if (relay === undefined) throw new Error('The sample bundle has changed');
    const bundle: Bundle = {
      ...bundled,
      competitions: {
        ...bundled.competitions,
        [VALTO]: {
          ...bundled.competitions[VALTO],
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
    const first = made(bundled, [VALTO]).bank;
    expect(bankFromBundle(bundled, [TELJES], [...banks, first], strategyGames))
      .toEqual({ errors: ['Two banks hold the id 10iqp4vy6b--csomag-kockak'] });
  });

  it('leaves out a clash among the competitions it is not given', () => {
    const bundle: Bundle = { ...bundled, competitions: { ...bundled.competitions, [MINTA_TELJES]: bundled.competitions[TELJES] } };
    expect(Object.keys(made(bundle, [VALTO]).bank.competitions)).toEqual([VALTO]);
  });

  it('refuses no competition, and one the bundle does not hold', () => {
    expect(bankFromBundle(bundled, [], banks, strategyGames)).toEqual({ errors: ['No competition is named'] });
    expect(bankFromBundle(bundled, [VALTO, 'nnnnnnnnnn--nincs'], banks, strategyGames))
      .toEqual({ errors: ['The bundle holds no competition nnnnnnnnnn--nincs'] });
  });
});
