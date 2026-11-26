import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Bundle } from './bundle';
import { readBundle } from './bundle';
import { bankFile, bankFromBundle, writeBank } from './bank-from-bundle';
import type { Bank } from './registry';

const VALTO = '903xajr9et--csomag-valto';
const TELJES = 'aqvco71pta--csomag-teljes';

// As the export writes it: its relay refers to k5g58wuf6h--minta-korongok, which the code holds.
const sample = readFileSync(join(__dirname, '..', 'fixtures', 'sample-bundle.json'), 'utf8');
const read = readBundle(JSON.parse(sample));
if ('errors' in read) throw new Error(read.errors.join('\n'));
const bundled = read.bundle;

function made(bundle: Bundle, ids: string[]) {
  const result = bankFromBundle(bundle, ids);
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
    expect(printed).toContain('  csomagProba,  (in the banks list)');
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

  it('writes nothing for a competition the bundle does not hold, and names those it does', () => {
    expect(() => writeBank(bundlePath, 'hianyzo', ['nnnnnnnnnn--nincs'], directory))
      .toThrow(`The bundle holds no competition nnnnnnnnnn--nincs\nThe bundle holds the competitions\n  ${VALTO}`);
    expect(existsSync(join(directory, 'hianyzo.ts'))).toBe(false);
  });

  it('refuses a file that is no bundle', () => {
    writeFileSync(bundlePath, '{}');
    expect(() => writeBank(bundlePath, 'csomag-proba', [VALTO], directory)).toThrow('is no exported bundle');
  });

  it.each(['Edition', '21-online', 'a--b', 'a_b', ''])('refuses the bank name "%s"', (name) => {
    expect(() => writeBank('unread.json', name, [VALTO], directory)).toThrow('no bank name');
  });
});

describe('bankFromBundle', () => {
  let directory: string;
  beforeAll(() => { directory = mkdtempSync(join(tmpdir(), 'bank-file-')); });
  afterAll(() => { rmSync(directory, { recursive: true, force: true }); });

  it('makes a file that exports the bank', async () => {
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

  it('refuses no competition, and one the bundle does not hold', () => {
    expect(bankFromBundle(bundled, [])).toEqual({ errors: ['No competition is named'] });
    expect(bankFromBundle(bundled, [VALTO, 'nnnnnnnnnn--nincs']))
      .toEqual({ errors: ['The bundle holds no competition nnnnnnnnnn--nincs'] });
  });
});
