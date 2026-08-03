import { moves } from './matches-on-edges';
import { emptyBoard, legalMoves, isTerminal, type Board } from './helpers';
import { makeCtx } from '../../../test-utils';

// The move size is forced (always the largest legal window), so a position runs
// out of moves on its own; the mover who leaves none wins.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

// Play the first legal move over and over, collecting each outcome.
const playToTheEnd = (start: Board) => {
  const outcomes: ReturnType<typeof moves.placeWindow.apply>[] = [];
  let board = start;
  let player = 0;
  while (!isTerminal(board)) {
    const { a, b } = legalMoves(board)[0];
    const outcome = moves.placeWindow.apply(board, asPlayer(player), a, b);
    outcomes.push(outcome);
    board = outcome.nextBoard;
    player = 1 - player;
  }
  return outcomes;
};

describe('end of game', () => {
  it.each([5, 6, 8, 9])('ends exactly on the last legal move (n = %i)', n => {
    const outcomes = playToTheEnd(emptyBoard(n));
    expect(outcomes.length).toBeGreaterThan(0);

    const last = outcomes[outcomes.length - 1];
    expect(isTerminal(last.nextBoard)).toBe(true);
    // outcomes alternate players starting from 0, so the last mover is known
    expect(last.gameEnd).toEqual({ winnerIndex: (outcomes.length - 1) % 2 });
    expect(last.isTurnEnd).toBeUndefined();

    for (const outcome of outcomes.slice(0, -1)) {
      expect(outcome.gameEnd).toBeUndefined();
      expect(outcome.isTurnEnd).toBe(true);
    }
  });
});
