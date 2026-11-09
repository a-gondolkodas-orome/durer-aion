import { strategyGames } from 'game';
import { validateRegistry } from 'problem-bank';
import { competitionOfTest, registry } from './practice-sets';
import { parseRelayTestCode } from './SelectRound';
import { teamData } from './teamData';

it('serves a valid registry', () => {
  expect(validateRegistry(registry, strategyGames)).toEqual([]);
});

// The selector names a test by its code, and the table maps the code to a
// competition: a slip in the table would serve another round's problems.
it.each(Object.entries(competitionOfTest))('maps %s to a relay of that edition, round and category', (code, id) => {
  const { year, round, category } = parseRelayTestCode(code);
  const competition = registry.competitions.get(id);
  expect(competition?.relay).toBeDefined();
  expect(competition?.metadata).toMatchObject({ kind: 'competition', edition: year, round, category });
});

it('has a competition for every test the selector lists', () => {
  expect(teamData.map(({ join_code }) => join_code).filter(code => !Object.hasOwn(competitionOfTest, code))).toEqual([]);
});
