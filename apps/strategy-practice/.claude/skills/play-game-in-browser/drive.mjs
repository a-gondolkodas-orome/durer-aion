// Everything up to "a game is running and it is my turn" is the same for all of
// the games: it is `strategy-game-factory`'s own chrome, not the game's. That
// part lives here. Clicking the board itself is per game and belongs in the
// calling script — a `BoardClient` is exactly the thing these helpers cannot
// know about.
//
// Playwright is a dependency of this app but nothing imports it (see the "//"
// note in package.json), so resolve it explicitly rather than from the
// caller's directory, which is usually somewhere under /tmp. Since the
// workspace join there is one install at the monorepo root, and npm decides
// per version conflict whether a package hoists there or nests here — so try
// both, nearest first.
import { existsSync, statSync } from 'node:fs';

const playwright = ['../../../node_modules/playwright/index.mjs', '../../../../../node_modules/playwright/index.mjs']
  .map(candidate => new URL(candidate, import.meta.url))
  .find(url => existsSync(url))?.href
  ?? (() => { throw new Error('playwright not found in the app or the repo root — run npm ci at the root'); })();

export const DEV_URL = 'http://localhost:8012';

// Claude Code's cloud container bakes one Chromium, sets
// PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD, and puts a `chromium` executable at the top of
// PLAYWRIGHT_BROWSERS_PATH. When the pinned playwright wants another revision, its
// own path does not exist there, so launch the baked one rather than fail.
// PLAYWRIGHT_CHROMIUM_EXECUTABLE overrides both.
const launchOptions = chromium => {
  const override = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  if (override) return { executablePath: override };
  if (existsSync(chromium.executablePath())) return {};
  const baked = process.env.PLAYWRIGHT_BROWSERS_PATH && `${process.env.PLAYWRIGHT_BROWSERS_PATH}/chromium`;
  return baked && existsSync(baked) && statSync(baked).isFile() ? { executablePath: baked } : {};
};

const START_BUTTON = { vsComputerFirst: 'Kezdő leszek', vsComputerSecond: 'Második leszek' };

// `npm run dev` (port 8012, pinned in vite.config.js) must already be running.
// The app is hash-routed, so the game id — the key in gameList.ts — goes after
// the `#`; a bare /game/<id> silently renders the overview instead.
export const launchGame = async (gameId, { mode = 'vsComputerFirst', variant, viewport } = {}) => {
  const { chromium } = await import(playwright);
  const browser = await chromium.launch(launchOptions(chromium));
  // The labels clicked below are Hungarian, and the app picks its language from the
  // browser's when the URL and localStorage name none — English on most machines.
  const page = await browser.newPage({ locale: 'hu-HU', viewport: viewport ?? { width: 900, height: 1100 } });

  await page.goto(`${DEV_URL}/#/game/${gameId}`);
  // The role chooser is the shell's pre-game state, so its arrival is what says
  // the app booted — the board renders before a game is running, too.
  await page.getByText('Válassz szerepet!').waitFor();

  // Mode and variant are `input[type=radio].sr-only`, so they are driven by
  // clicking their label text. Both restart the game, hence before the start
  // button rather than after.
  if (variant) await page.getByText(variant, { exact: true }).click();
  if (mode === 'vsHuman') {
    await page.getByText('🤝 2 játékos').click();
    // Two-player mode asks which side begins; without this the board renders
    // but every piece stays disabled.
    await page.getByRole('button', { name: 'Kezdek' }).first().click();
  } else {
    await page.getByRole('button', { name: START_BUTTON[mode] }).click();
  }

  await page.waitForTimeout(300);
  const notStarted = await page.getByText(/Válassz szerepet!|^Kezdek$/).count();
  if (notStarted) throw new Error(`${gameId}: still on the role chooser — the game did not start`);

  return { browser, page };
};

// Mid-turn states — a pile emptied but not yet split, a bot part-way through a
// multi-move turn — last one `stepDelay()` beat, 750-1250 ms (see
// strategy-game-factory/engine/timing.ts). They have to be sampled rather than
// awaited: a `waitFor` for the state that follows usually resolves after the
// interesting frame is already gone.
export const sampleDuringBeat = async (page, read, { ms = 1600, every = 50 } = {}) => {
  const seen = new Set();
  for (let elapsed = 0; elapsed < ms; elapsed += every) {
    for (const value of await read(page)) seen.add(value);
    await page.waitForTimeout(every);
  }
  return [...seen];
};

export const readAll = async (page, selector) =>
  Promise.all((await page.locator(selector).all()).map(async el => (await el.textContent()).trim()));
