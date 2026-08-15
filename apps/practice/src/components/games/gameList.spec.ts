import { gameList } from './gameList';
import * as gameComponents from './index';

const components = gameComponents as Record<string, unknown>;

// Guards the curated `featured` count, which the type system can't express.
// (Icon-key validity is already enforced by types: `icon` is an `IconKey` and
// `gameIcons` is a total `Record<IconKey, …>`.)
describe('gameList integrity', () => {
  const entries = Object.values(gameList);

  it('has a curated set of 6-8 featured games', () => {
    const featured = entries.filter(g => g.featured);
    expect(featured.length).toBeGreaterThanOrEqual(6);
    expect(featured.length).toBeLessThanOrEqual(8);
  });

  // The router (app.tsx) loops over gameList and looks each key up in the games
  // barrel, so the two must stay in one-to-one sync: a missing re-export would
  // render `undefined` for that route, and an orphan component would never be
  // reachable.
  it('re-exports exactly one component per game and no orphans', () => {
    expect(Object.keys(components).sort()).toEqual(Object.keys(gameList).sort());
  });

  it('re-exports a defined component for every game', () => {
    for (const key of Object.keys(gameList)) {
      expect(components[key], `missing component for "${key}"`).toBeDefined();
    }
  });
});
