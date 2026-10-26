// Every app's page opts out of browser translation, and says it is Hungarian until the app sets
// the language it loads (`common/i18n.ts`, and the strategy practice site's `document-title.ts`).
//
// A translator such as Chrome's swaps the page's text nodes for translated copies, and React keeps
// updating the originals it holds, which are no longer on screen (facebook/react#11538). The relay
// heading then freezes on the number it had when the page was translated, while the problem text,
// set as a whole block, keeps changing: a team on the 4th problem reads "1. feladat". It also
// splits latex.js's per-letter formula markup into nonsense. A page declared in the wrong language
// is offered for translation without anyone asking, so `lang` matters too, but only
// `translate="no"` and the `notranslate` meta stop a translation the browser's own language asks for.
//
// The apps are found by their `index.html` rather than listed, so one added later is covered the
// day it lands.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const appsDir = fileURLToPath(new URL('../../apps/', import.meta.url));

const appsWithAPage = readdirSync(appsDir, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && existsSync(`${appsDir}${entry.name}/index.html`))
  .map(entry => entry.name);

describe("the apps' pages", () => {
  it('are found', () => {
    expect(appsWithAPage.length).toBeGreaterThan(0);
  });

  describe.each(appsWithAPage)('%s', (app) => {
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
