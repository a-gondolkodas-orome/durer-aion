import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Bundle } from './bundle';
import { writeBank } from './bank-from-bundle';

const VALTO = '903xajr9et--csomag-valto';
const TELJES = 'aqvco71pta--csomag-teljes';
const sample = readFileSync(new URL('../fixtures/sample-bundle.json', import.meta.url), 'utf8');

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
    withBundle(bundle => { bundle.competitions['klmgbpb334--minta-teljes'] = bundle.competitions[TELJES]; });
    expect(() => writeBank(bundlePath, 'clash', ['klmgbpb334--minta-teljes'], directory))
      .toThrow(`klmgbpb334--minta-teljes is in code already\nThe bundle holds the competitions\n  ${VALTO}`);
    expect(existsSync(join(directory, 'clash.ts'))).toBe(false);
  });

  it.each(['Edition', '21-online', 'a--b', 'a_b', ''])('refuses the bank name "%s"', (name) => {
    expect(() => writeBank('unread.json', name, [VALTO], directory)).toThrow('no bank name');
  });
});
