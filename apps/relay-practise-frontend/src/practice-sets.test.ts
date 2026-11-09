import { strategyGames } from 'game';
import { validateRegistry } from 'problem-bank';
import { practiceSets, registry } from './practice-sets';

it('serves a valid registry', () => {
  expect(validateRegistry(registry, strategyGames)).toEqual([]);
});

it('lists each set once', () => {
  expect(new Set(practiceSets.map(({ id }) => id)).size).toBe(practiceSets.length);
});

// Two listed past rounds with the same edition, round and category could not
// be told apart in the selector.
it('lists each past round once', () => {
  const keys = practiceSets.flatMap(({ metadata }) => metadata.kind === 'competition'
    ? [`${metadata.edition} ${metadata.round} ${metadata.category}`]
    : []);
  expect(new Set(keys).size).toBe(keys.length);
});
