import { range, uniq } from 'lodash';
import { randomBotStrategy, smartBotStrategy } from './bot-strategy';
import {
  ALLOWED, getAllowedMoves, moves, withTriangleColored, triangles, type Board
} from './gameplay';
import { botNextMoveArgs, makeCtx, moveValidator } from 'test-utils';

// Fold the production transform rather than transcribing ALLOWED/FORBIDDEN by
// hand: the forbidden set is then whatever the game says it is.
const boardAfterColoring = (ids: number[]): Board =>
  ids.reduce(withTriangleColored, Array(triangles.length).fill(ALLOWED) as Board);

const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

const isColoringAllowed = moveValidator(moves.colorTriangle);

const triangleNamed = (board: Board): number =>
  botNextMoveArgs(smartBotStrategy({ board, ctx: makeCtx() }))[0];

// Unlike the other games' bots this one states no rule — it searches the whole
// tree and takes any move the opponent cannot answer. So the cases that mean
// something are the ones where the search is the only way to find the move.
describe('smartBotStrategy', () => {
  it('takes the last triangle, which ends the game in its favour', () => {
    const board = boardAfterColoring([0, 1, 3, 4, 6, 8, 9, 11, 13]);
    expect(getAllowedMoves(board)).toEqual([15]);

    expect(triangleNamed(board)).toBe(15);
    expect(moves.colorTriangle.apply(board, asPlayer(0), 15).gameEnd)
      .toEqual({ winnerIndex: 0 });
  });

  it.each([
    [[0, 1, 3, 4, 9, 12], [8, 14, 15], 14],
    [[0, 1, 3, 4, 9, 14], [6, 11, 12], 12]
  ])('finds the single winning triangle among %j', (colored, allowed, winner) => {
    // Three triangles are open and only one of them wins; the other two hand
    // the game to the opponent. Nothing local to the board says which — the
    // bot has to look ahead, so this is the case a broken search fails.
    const board = boardAfterColoring(colored as number[]);
    expect(getAllowedMoves(board)).toEqual(allowed);

    // it shuffles before searching, so the answer must not depend on the draw
    expect(uniq(range(20).map(() => triangleNamed(board)))).toEqual([winner]);
  });

  it('plays on when the position is already lost, without freezing on one move', () => {
    // Two triangles left and both lose, so the search finds nothing and the
    // bot falls back to a draw — it must still cover both.
    const board = boardAfterColoring([0, 1, 3, 4, 6, 8, 9, 11]);
    expect(getAllowedMoves(board)).toEqual([13, 15]);

    expect(new Set(range(40).map(() => triangleNamed(board)))).toEqual(new Set([13, 15]));
  });

  it('names an open triangle from the opening position, which the mover loses', () => {
    // The full board is a loss for whoever moves first, so there is no winning
    // opening to assert — only that the bot still produces a legal move.
    const board = boardAfterColoring([]);

    // the search is exhaustive and unmemoised, so keep this to a few calls
    for (const named of range(3).map(() => triangleNamed(board))) {
      expect(isColoringAllowed(board, named)).toBe(true);
    }
  });

  it('never names a triangle that is coloured or forbidden', () => {
    const boards = [
      [0], [0, 1], [2, 4], [0, 3, 9, 12], [0, 1, 4, 9, 13], [0, 1, 3, 4, 9]
    ].map(boardAfterColoring);

    const illegal = boards.flatMap(board =>
      range(5)
        .map(() => triangleNamed(board))
        .filter(id => !isColoringAllowed(board, id))
        .map(id => `${getAllowedMoves(board)} -> ${id}`));

    expect(uniq(illegal)).toEqual([]);
  });
});

describe('randomBotStrategy', () => {
  it('draws only from the open triangles, and reaches all of them', () => {
    const board = boardAfterColoring([0, 1, 3, 4, 9]);
    const open = getAllowedMoves(board);
    const seen = uniq(range(200).map(() =>
      botNextMoveArgs(randomBotStrategy({ board, ctx: makeCtx() }))[0]));

    expect(seen.sort((a, b) => a - b)).toEqual(open);
  });
});
