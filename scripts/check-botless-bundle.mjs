// Asserts the built online frontend ships none of the strategy bots. The `game` package exports
// the bots from the same entry the boards come from, so nothing but tree-shaking keeps them out
// of the live bundle — one stray import from a `strategy.ts` into a board would hand every
// competitor the bot's tables. See CLAUDE.md, *Creating a New Game*.
//
// The bundle is minified, so function and variable names prove nothing. String literals survive
// minification, and a table-driven bot is full of them — so for each game the check takes the
// bot-only sources (files reachable from `strategy.ts` but not from the game, board or
// description), samples their most distinctive literals, and fails when the built bundle
// contains them. A game whose bot has no usable literal fails the check outright: it would
// otherwise be invisible to it, and a lookup table or one distinctive constant fixes that.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const GAMES_DIR = 'packages/game/src/games/strategy';
const DIST_DIR = 'apps/online-frontend/dist';

// Files whose content is allowed in the client bundle, and so anchor the "shipped" side of the
// classification. `index.ts` is deliberately not one: it re-exports the strategy too.
const SHIPPED_ROOTS = ['game.ts', 'board.tsx', 'main.tsx'];
const BOT_ROOT = 'strategy.ts';

export const localImports = source =>
  [...source.matchAll(/from\s+['"](\.[^'"]+)['"]/g)].map(match => match[1]);

const resolveLocal = (dir, specifier) =>
  [`${specifier}.ts`, `${specifier}.tsx`, join(specifier, 'index.ts')]
    .map(candidate => join(dir, candidate))
    .find(existsSync);

// Every file in `dir` reachable from `roots` through relative imports. Imports that leave the
// game's folder (../../common and the like) are shared framework code, not part of the game.
const reachable = (dir, roots) => {
  const seen = new Set(roots.map(root => join(dir, root)).filter(existsSync));
  for (const file of seen) {
    for (const specifier of localImports(readFileSync(file, 'utf8'))) {
      const resolved = resolveLocal(dirname(file), specifier);
      if (resolved && !relative(dir, resolved).startsWith('..')) seen.add(resolved);
    }
  }
  return seen;
};

export const botOnlyFiles = dir => {
  const shipped = reachable(dir, SHIPPED_ROOTS);
  return [...reachable(dir, [BOT_ROOT])].filter(file => !shipped.has(file));
};

export const shippedText = dir =>
  [...reachable(dir, SHIPPED_ROOTS)].map(file => readFileSync(file, 'utf8')).join('\n');

// The longest string literals of a source, longest first. Length keeps out incidental short
// strings ('0', 'live') that legitimately appear client-side; anything path-like is an import
// or asset reference, equally likely to appear for innocent reasons.
export const extractMarkers = (source, { minLength = 4, max = 20 } = {}) => {
  const literals = [...source.matchAll(/'([^'\\\n]+)'|"([^"\\\n]+)"/g)]
    .map(match => match[1] ?? match[2])
    .filter(literal => literal.length >= minLength && !literal.includes('/'));
  return [...new Set(literals)].sort((a, b) => b.length - a.length).slice(0, max);
};

const walk = dir =>
  readdirSync(dir).flatMap(entry => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

// A single marker in the bundle could be coincidence — the shortest are four characters of
// minified output. A shipped bot brings all of its literals along, so half of them is proof.
export const verdict = (markers, bundle) => {
  const hits = markers.filter(marker => bundle.includes(marker));
  const threshold = Math.min(markers.length, Math.max(2, markers.length / 2));
  return { hits, shipped: hits.length >= threshold };
};

export const checkGames = (gamesDir, distDir) => {
  const bundle = walk(distDir)
    .filter(path => /\.(js|mjs)$/.test(path))
    .map(path => readFileSync(path, 'utf8'))
    .join('\n');

  // The game wrapper and its types ship with every client, and the strategies quote some of
  // their strings (move names, difficulty modes) — those literals prove nothing either.
  const commonDir = join(gamesDir, '..', '..', 'common');
  const commonText = existsSync(commonDir)
    ? walk(commonDir).map(path => readFileSync(path, 'utf8')).join('\n')
    : '';

  const failures = [];
  for (const name of readdirSync(gamesDir)) {
    const dir = join(gamesDir, name);
    if (!existsSync(join(dir, BOT_ROOT))) continue;

    // A literal the shipped files also contain (a move name, a shared label) is legitimately in
    // the bundle and proves nothing, so it cannot serve as a marker.
    const shared = shippedText(dir) + commonText;
    const markers = botOnlyFiles(dir)
      .flatMap(file => extractMarkers(readFileSync(file, 'utf8')))
      .filter(marker => !shared.includes(marker));
    if (markers.length === 0) {
      failures.push(`${name}: its bot has no distinctive string literal, so this check cannot ` +
        `see it — give the strategy one (a lookup table counts)`);
      continue;
    }
    const { hits, shipped } = verdict(markers, bundle);
    if (shipped) {
      failures.push(`${name}: bot literals found in the online bundle (${hits.length} of ` +
        `${markers.length} markers, e.g. ${JSON.stringify(hits[0])})`);
    }
  }
  return failures;
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!existsSync(DIST_DIR)) {
    console.error(`${DIST_DIR} does not exist — build first: npm run build`);
    process.exit(1);
  }
  const failures = checkGames(GAMES_DIR, DIST_DIR);
  if (failures.length > 0) {
    console.error('The online bundle is not bot-free:');
    for (const failure of failures) console.error(`  ${failure}`);
    process.exit(1);
  }
  console.log('No bot strategy in the online bundle.');
}
