import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { importName, writeBank } from './bank-from-bundle.mjs';

const sample = readFileSync(new URL('../packages/problem-bank/fixtures/sample-bundle.json', import.meta.url), 'utf8');

let directory;
beforeEach(() => { directory = mkdtempSync(join(tmpdir(), 'bank-from-bundle-')); });
afterEach(() => { rmSync(directory, { recursive: true, force: true }); });

describe('bank-from-bundle.mjs', () => {
  it('writes the bank, and prints what registers it', () => {
    const bundlePath = join(directory, 'bundle.json');
    writeFileSync(bundlePath, sample);

    const printed = writeBank(bundlePath, 'csomag-proba', directory);

    expect(readFileSync(join(directory, 'csomag-proba.ts'), 'utf8')).toContain("export const competitions: CompetitionBank = {\n  '903xajr9et--csomag-valto': {");
    expect(printed).toContain("  import * as csomagProba from './banks/csomag-proba';");
    expect(printed).toContain('  "aqvco71pta--csomag-teljes",  (in listedIds)');
  });

  it('refuses to write over a bank', () => {
    const bundlePath = join(directory, 'bundle.json');
    writeFileSync(bundlePath, sample);
    writeFileSync(join(directory, 'taken.ts'), '');
    expect(() => writeBank(bundlePath, 'taken', directory)).toThrow('exists already');
  });

  it('refuses a bundle with a competition the banks hold, writing nothing', () => {
    const bundle = JSON.parse(sample);
    bundle.competitions['klmgbpb334--minta-teljes'] = bundle.competitions['aqvco71pta--csomag-teljes'];
    const bundlePath = join(directory, 'bundle.json');
    writeFileSync(bundlePath, JSON.stringify(bundle));
    expect(() => writeBank(bundlePath, 'clash', directory)).toThrow('klmgbpb334--minta-teljes is in code already');
    expect(existsSync(join(directory, 'clash.ts'))).toBe(false);
  });

  it.each(['Edition', '21-online', 'a--b', 'a_b', ''])('refuses the bank name "%s"', (name) => {
    expect(() => writeBank('unread.json', name, directory)).toThrow('no bank name');
  });

  it('imports edition-21-online as edition21Online', () => {
    expect(importName('edition-21-online')).toBe('edition21Online');
  });
});
