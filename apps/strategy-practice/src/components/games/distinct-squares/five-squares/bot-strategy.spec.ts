import { range, uniq } from 'lodash';
import { runMatch, type MatchResult } from 'strategy-game-factory';
import { moves, generateStartBoard, type Board } from './gameplay';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { makeCtx } from 'test-utils';

const startBoardOn = (square: number): Board => {
  const board = Array(5).fill(0);
  board[square] = 1;
  return board;
};

// Play a real game through the engine: the same moves, validator and win
// detection the site runs on.
const play = (
  board: Board, strategies: [typeof smartBotStrategy, typeof smartBotStrategy]
): MatchResult<Board> => runMatch({ gameplay: { moves }, strategies, startBoard: board });

const namedSquares = (strategy: typeof smartBotStrategy, board: Board, currentPlayer: number) => {
  const named = strategy({ board, ctx: makeCtx({ currentPlayer }) });
  return (Array.isArray(named) ? named : [named]).map(({ args }) => args![0] as number);
};

// The second player wins exactly when the ten pieces end up spread over five
// distinct counts, and with best play they always can — from every start square,
// so that is the side whose optimality can be asserted. The first player is
// already lost and can only win on a mistake.
describe('smartBotStrategy', () => {
  // The minimax runs unmemoised over the whole game tree, which is why
  // FiveSquares[1] is listed out of plays-to-an-end.spec.ts; five matches is
  // the exhaustive argument here, since the start board is one piece on one of
  // the five squares.
  it('wins as the replier from every start square in optimal-vs-optimal play', () => {
    for (const square of range(5)) {
      const { winnerIndex, board } = play(startBoardOn(square), [smartBotStrategy, smartBotStrategy]);
      expect(winnerIndex).toBe(1);
      // its win condition, read off the final board rather than assumed
      expect(uniq(board).length).toBe(5);
    }
  }, 20000);

  it('wins as the replier against the random bot', () => {
    for (let trial = 0; trial < 3; trial++) {
      expect(play(generateStartBoard(), [randomBotStrategy, smartBotStrategy]).winnerIndex).toBe(1);
    }
  }, 20000);
});

// A turn is one placement for the first player and two for the second, and the
// bots name a whole turn at once — so the count of names, not just their
// values, is part of the contract the engine plays out.
describe.each([
  ['smartBotStrategy', smartBotStrategy],
  ['randomBotStrategy', randomBotStrategy]
])('%s', (_name, strategy) => {
  // late enough that the smart bot's search is shallow: these are about the
  // shape of what it names, not which square it picks
  const latePosition: Board = [2, 2, 1, 1, 1];

  it('names one placement as the first player and two as the second', () => {
    expect(namedSquares(strategy, latePosition, 0)).toHaveLength(1);
    expect(namedSquares(strategy, latePosition, 1)).toHaveLength(2);
  });

  it('only ever names a square that exists', () => {
    for (const currentPlayer of [0, 1]) {
      for (const square of namedSquares(strategy, latePosition, currentPlayer)) {
        expect(Number.isInteger(square)).toBe(true);
        expect(square).toBeGreaterThanOrEqual(0);
        expect(square).toBeLessThan(5);
      }
    }
  });
});
