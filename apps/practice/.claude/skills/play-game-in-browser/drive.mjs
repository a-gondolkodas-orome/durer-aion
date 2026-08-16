// Everything up to "a game is running and it is my turn" is the same for all of
// the games: it is `strategy-game-factory`'s own chrome, not the game's. That
// part lives here. Clicking the board itself is per game and belongs in the
// calling script — a `BoardClient` is exactly the thing these helpers cannot
// know about.
//
// Playwright is a dependency of this repo but nothing imports it (see the "//"
// note in package.json), so resolve it from the repo root rather than from the
// caller's directory, which is usually somewhere under /tmp.
const playwright = new URL('../../../node_modules/playwright/index.mjs', import.meta.url).href;

export const DEV_URL = 'http://localhost:8012';

const START_BUTTON = { vsComputerFirst: 'Kezdő leszek', vsComputerSecond: 'Második leszek' };

// `npm run dev` (port 8012, pinned in vite.config.js) must already be running.
// The app is hash-routed, so the game id — the key in gameList.ts — goes after
// the `#`; a bare /game/<id> silently renders the overview instead.
export const launchGame = async (gameId, { mode = 'vsComputerFirst', variant, viewport } = {}) => {
  const { chromium } = await import(playwright);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: viewport ?? { width: 900, height: 1100 } });

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
