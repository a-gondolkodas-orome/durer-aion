import { removeDivisorMultipleCompetition } from './remove-divisor-multiple/competition';
import { stonesRemoveOneNotTwiceFromLeftCompetition } from './stones-remove-one-not-twice-from-left/competition';
import { moves as rdmMoves } from './remove-divisor-multiple/gameplay';
import { smartBotStrategy as rdmSmart, randomBotStrategy as rdmRandom } from './remove-divisor-multiple/bot-strategy';
import { competitionStartBoardsC, competitionStartBoardsD } from './remove-divisor-multiple/start-boards';
import { moves as stonesMoves, testStartBoards, isRemovalAllowed } from './stones-remove-one-not-twice-from-left/gameplay';
import { competitionStartBoardsE } from './stones-remove-one-not-twice-from-left/start-boards';

// The competition slices are wiring, and wrong wiring (the test bot in the
// live slot, another game's boards) would type-check fine — identity is the
// property worth pinning.
describe('competition game slices', () => {
  it('remove-divisor-multiple wires its own pieces into the right slots', () => {
    expect(removeDivisorMultipleCompetition.gameplay.moves).toBe(rdmMoves);
    expect(removeDivisorMultipleCompetition.liveBot).toBe(rdmSmart);
    expect(removeDivisorMultipleCompetition.testBot).toBe(rdmRandom);
    expect(removeDivisorMultipleCompetition.liveStartBoardsByCategory).toEqual({
      C: competitionStartBoardsC,
      D: competitionStartBoardsD
    });
  });

  it('stones wires its own pieces and deals test boards from the Teszt list', () => {
    expect(stonesRemoveOneNotTwiceFromLeftCompetition.gameplay.moves).toBe(stonesMoves);
    expect(stonesRemoveOneNotTwiceFromLeftCompetition.liveStartBoardsByCategory).toEqual({
      E: competitionStartBoardsE
    });
    const dealt = stonesRemoveOneNotTwiceFromLeftCompetition.generateTestStartBoard();
    expect(testStartBoards).toContainEqual(dealt);
    // cloned, so a match scribbling on its board cannot corrupt the list
    dealt.piles[0] = 99;
    expect(testStartBoards).not.toContainEqual(dealt);
  });

  it('remove-divisor-multiple deals a legal test board', () => {
    const dealt = removeDivisorMultipleCompetition.generateTestStartBoard();
    expect(dealt.previousMove).toBeNull();
    expect(dealt.numbersOnTable.every(Boolean)).toBe(true);
  });

  it('stones start boards begin unrestricted', () => {
    expect(isRemovalAllowed(competitionStartBoardsE[0]!, 0, 0)).toBe(true);
  });
});
