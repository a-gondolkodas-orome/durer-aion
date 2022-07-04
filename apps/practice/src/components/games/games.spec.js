import { gameList, gameComponents } from './games';

describe('games', () => {
  it('gameList and gameComponents should have the same set of games listed', () => {
    expect(Object.keys(gameList)).toIncludeSameMembers(Object.keys(gameComponents));
  });

  it.each(Object.values(gameList))(
    'all game strategies should have the mandatory properties', (gameDefinition) => {
    expect(Object.keys(gameDefinition.strategy)).toIncludeAllMembers([
      'generateNewBoard',
      'isTheLastMoverTheWinner',
      'getGameStateAfterAiMove'
    ]);
  });
});