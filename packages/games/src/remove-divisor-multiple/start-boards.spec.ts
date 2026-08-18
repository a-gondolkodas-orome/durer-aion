import { forcedWinnerIndex } from 'test-utils';
import { competitionStartBoardsC, competitionStartBoardsD } from './start-boards';
import { moves } from './gameplay';
import { smartBotStrategy } from './bot-strategy';

// Every competition board is judged, not sampled — the list is what the
// competition hands out, so each entry must be decisive for the role the
// designers intended. See src/components/CLAUDE.md § Curated start boards.
describe('competition start boards', () => {
  // Both categories run the same pattern: the opening board of a streak falls
  // to the second player, the follow-up board to the first — so winning twice
  // in a row forces the team to change roles between the two wins.
  it.each([
    ['C', competitionStartBoardsC],
    ['D', competitionStartBoardsD]
  ])('category %s: the winning role flips between the streak\'s two boards', (_category, boards) => {
    const winners = boards.map(startBoard => forcedWinnerIndex({
      gameplay: { moves },
      botStrategy: smartBotStrategy,
      startBoard
    }));
    expect(winners).toEqual([1, 0]);
  });
});
