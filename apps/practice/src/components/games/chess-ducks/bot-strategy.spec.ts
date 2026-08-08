import { range } from 'lodash';
import { runMatch, type MatchResult } from 'strategy-game-factory';
import {
  getAllowedMoves, withDuckPlaced, moves, type Board, type Field
} from './gameplay';
import {
  smartBotStrategy, randomBotStrategy, smartBotOptimalSecondSteps, smartBotOptimalThirdSteps
} from './bot-strategy';
import { botNextMoveArgs, makeCtx, moveValidator } from 'test-utils';

const isPlacementAllowed = moveValidator(moves.placeDuck);

const emptyBoard = (rows: number, cols: number): Board =>
  range(rows).map(() => range(cols).map(() => null));

const boardWithDucks = (cols: number, ...ducks: Field[]): Board =>
  ducks.reduce(withDuckPlaced, emptyBoard(4, cols));

// Play a real game through the engine: the same moves, validator and win
// detection the site runs on.
const play = (
  board: Board, strategies: [typeof smartBotStrategy, typeof smartBotStrategy]
): MatchResult<Board> => runMatch({ gameplay: { moves }, strategies, startBoard: board });

const askSmartBot = (board: Board): Field =>
  botNextMoveArgs(smartBotStrategy({ board, ctx: makeCtx({ currentPlayer: 0 }) }))[0];

const at = (key: string): Field => {
  const [row, col] = key.split(';').map(Number);
  return { row: row!, col: col! };
};

// Both board sizes are a win for the second player, so that is the side whose
// optimality can be asserted; as the mover the bot is already lost and can only
// win when the opponent errs.
describe('smartBotStrategy', () => {
  // A searching bot on a board this size is why the variant is listed out of
  // plays-to-an-end.spec.ts, so these play a few boards rather than sweeping.
  it.each([[4, 6], [4, 7]])('wins as the replier on %ix%i against the random bot', (rows, cols) => {
    for (let trial = 0; trial < 3; trial++) {
      expect(play(emptyBoard(rows, cols), [randomBotStrategy, smartBotStrategy]).winnerIndex).toBe(1);
    }
  }, 20000);

  it.each([[4, 6], [4, 7]])('wins as the replier on %ix%i in optimal-vs-optimal play', (rows, cols) => {
    expect(play(emptyBoard(rows, cols), [smartBotStrategy, smartBotStrategy]).winnerIndex).toBe(1);
  }, 20000);
});

// The 4x7 opening books are generated offline by
// scripts/pre-generate-ai-moves/, because searching those positions live takes
// seconds — a single isWinningState call from a three-duck board runs for
// several. That price is also the limit of what these tests can claim: proving
// an entry *optimal* needs exactly the search the book exists to avoid, so
// nothing here re-derives the values. What is pinned instead is everything
// around them — that every entry names a placement the game allows, that the
// lookup keys still match the positions they are built from (a format change
// would silently drop the bot to its random fallback), and that the symmetry
// inversion hands back the mirrored answer for a mirrored position.
describe('opening books', () => {
  it('recommends a legal placement from every reachable position they cover', () => {
    for (const first of getAllowedMoves(emptyBoard(4, 7))) {
      const afterFirst = withDuckPlaced(emptyBoard(4, 7), first);
      expect(isPlacementAllowed(afterFirst, askSmartBot(afterFirst))).toBe(true);

      for (const second of getAllowedMoves(afterFirst)) {
        const afterSecond = withDuckPlaced(afterFirst, second);
        expect(isPlacementAllowed(afterSecond, askSmartBot(afterSecond))).toBe(true);
      }
    }
  });

  it('still finds its second-step entry for every duck it covers', () => {
    for (const [duck, answer] of Object.entries(smartBotOptimalSecondSteps)) {
      expect(askSmartBot(boardWithDucks(7, at(duck)))).toEqual(answer);
    }
  });

  it('still finds its third-step entry for every pair it covers', () => {
    for (const [pair, answer] of Object.entries(smartBotOptimalThirdSteps)) {
      const [first, second] = pair.split(' - ').map(at);
      expect(askSmartBot(boardWithDucks(7, first!, second!))).toEqual(answer);
    }
  });

  // getOptimalThirdStep looks a position up under four transformations and
  // inverts whichever one hit, so a mirrored position must get the mirrored
  // answer. A position that is its own mirror is excluded: there both the
  // answer and its mirror are optimal, and the book names only one of them.
  it('mirrors its third-step answer for a mirrored position', () => {
    const flip = ({ row, col }: Field): Field => ({ row, col: 6 - col });

    for (const [pair, answer] of Object.entries(smartBotOptimalThirdSteps)) {
      const [first, second] = pair.split(' - ').map(at);
      const mirrored = boardWithDucks(7, flip(first!), flip(second!));
      if (JSON.stringify(mirrored) === JSON.stringify(boardWithDucks(7, first!, second!))) continue;
      expect(askSmartBot(mirrored)).toEqual(flip(answer));
    }
  });
});

describe('randomBotStrategy', () => {
  it('only ever names a placement the game allows', () => {
    let board = emptyBoard(4, 6);
    while (getAllowedMoves(board).length > 0) {
      const field = botNextMoveArgs(randomBotStrategy({ board, ctx: makeCtx({ currentPlayer: 0 }) }))[0];
      expect(isPlacementAllowed(board, field)).toBe(true);
      board = withDuckPlaced(board, field);
    }
  });
});
