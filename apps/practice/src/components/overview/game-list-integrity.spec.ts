import { gameList } from '../games/gameList';

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
});
