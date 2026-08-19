import { forcedWinnerIndex } from 'test-utils';
import { competitionStartBoardsE } from './start-boards';
import { moves } from './gameplay';
import { smartBotStrategy } from './bot-strategy';

// Every competition board is judged, not sampled. The winners are pinned as a
// list because — unlike remove-divisor-multiple — the designers did not make
// every pair role-flipping; what each board forces is part of the curation.
describe('competition start boards', () => {
  it('category E: each board forces the winner the designers curated', () => {
    const winners = competitionStartBoardsE.map(startBoard => forcedWinnerIndex({
      gameplay: { moves },
      botStrategy: smartBotStrategy,
      startBoard
    }));
    expect(winners).toEqual([1, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0]);
  });
});
