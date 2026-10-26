// Every app built on common-frontend opts its page out of browser translation, and says it is
// Hungarian until i18next sets the language it loads (`common/i18n.ts`).
//
// A translator such as Chrome's swaps the page's text nodes for translated copies, and React keeps
// updating the originals it holds, which are no longer on screen (facebook/react#11538). The relay
// heading then freezes on the number it had when the page was translated, while the problem text,
// set as a whole block, keeps changing: a team on the 4th problem reads "1. feladat". It also
// splits latex.js's per-letter formula markup into nonsense. A page declared in the wrong language
// is offered for translation without the team asking, so `lang` matters too, but only
// `translate="no"` and the `notranslate` meta stop a translation the browser's own language asks for.
//
// The apps are found by their dependency on common-frontend rather than listed, so one added later
// is covered the day it lands.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const appsDir = fileURLToPath(new URL('../../apps/', import.meta.url));

const appsOnCommonFrontend = readdirSync(appsDir, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && existsSync(`${appsDir}${entry.name}/package.json`))
  .map(entry => entry.name)
  .filter(name => {
    const { dependencies = {}, devDependencies = {} } =
      JSON.parse(readFileSync(`${appsDir}${name}/package.json`, 'utf8'));
    return 'common-frontend' in dependencies || 'common-frontend' in devDependencies;
  });

describe('the pages built on common-frontend', () => {
  it('are found', () => {
    expect(appsOnCommonFrontend.length).toBeGreaterThan(0);
  });

  describe.each(appsOnCommonFrontend)('%s', (app) => {
    const page = readFileSync(`${appsDir}${app}/index.html`, 'utf8');
    const htmlTag = page.match(/<html\b[^>]*>/)?.[0] ?? '';

    it('declares the page Hungarian', () => {
      expect(htmlTag).toMatch(/\slang="hu"/);
    });

    it('opts out of browser translation', () => {
      expect(htmlTag).toMatch(/\stranslate="no"/);
      expect(page).toMatch(/<meta\s+name="google"\s+content="notranslate"\s*\/?>/);
    });
  });
});
