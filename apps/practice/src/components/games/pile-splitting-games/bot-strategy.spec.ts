import { random, range } from 'lodash';
import {
  runMatch, type BotStrategy, type MoveDefinition
} from 'strategy-game-factory';
import { makeCtx } from 'test-utils';
import { randomBotStrategy } from './bot-strategy';
import { isLosingForMover, isRemovalAllowed, moves, type Board } from './gameplay';
import { smartBotStrategy as smartTwoPileBot } from './pile-splitter/bot-strategy';
import { smartBotStrategy as smartThreePileBot } from './pile-splitter-3/bot-strategy';
import { smartBotStrategy as smartFourPileBot } from './pile-splitter-4/bot-strategy';

// The random bot reads the number of piles off the board, so one spec covers
// all three sibling games. `runMatch` throws on a move the rules reject, which
// is the assertion here: whatever it picks, both halves of the turn are legal —
// including on boards where only one pile can be split, so most removals are
// not allowed at all.
const startBoards: Board[] = [[2, 3], [1, 4], [3, 5, 4], [1, 1, 4], [2, 6, 3, 7], [1, 1, 1, 5]];

// It picks at random, so each board has to hold for every draw it can make.
const ITERATIONS = 20;

describe('random pile-splitting bot', () => {
  it.each(startBoards)('only ever plays legal turns, from %j', (...startBoard) => {
    for (let i = 0; i < ITERATIONS; i++) {
      const { winnerIndex } = runMatch({
        gameplay: { moves },
        strategies: [randomBotStrategy, randomBotStrategy],
        startBoard
      });
      expect([0, 1]).toContain(winnerIndex);
    }
  });
});

// Plays a whole named turn through the real moves, as the engine would — each
// half checked against its own `validate` first, which is what the engine does
// with a bot's move and what it throws on. Each sibling names its turn as both
// halves at once, so the reduction runs them in the order the bot listed them.
const playSmartTurn = (botStrategy: BotStrategy<Board>, board: Board): Board => {
  const ctx = makeCtx({ currentPlayer: 0 });
  const named = botStrategy({ board, ctx });
  const turnMoves: Record<string, MoveDefinition<Board>> = moves;

  return (Array.isArray(named) ? named : [named]).reduce((current, { move, args = [] }) => {
    const definition = turnMoves[move]!;
    expect([board, move, definition.validate!(current, { ctx }, ...args)])
      .toEqual([board, move, true]);
    return definition.apply(current, { ctx }, ...args).nextBoard;
  }, board);
};

// Non-decreasing tuples: the value of a position depends on the pile sizes
// alone, so one ordering of each stands for all of them.
const boardsUpTo = (pileCount: number, maxPile: number): Board[] =>
  pileCount === 0
    ? [[]]
    : boardsUpTo(pileCount - 1, maxPile).flatMap(rest =>
      range(rest[rest.length - 1] ?? 1, maxPile + 1).map(size => [...rest, size]));

// The property that makes a bot optimal, checked a turn at a time rather than
// over a match: from a position the mover can win, the turn it names must hand
// the opponent one they cannot. A match only says who won — against a bot that
// plays at random a thrown-away win is usually not punished, which is how the
// four-pile bot gave one up in roughly a quarter of its turns unnoticed.
const smartBots = [
  { pileCount: 2, maxPile: 12, botStrategy: smartTwoPileBot },
  { pileCount: 3, maxPile: 9, botStrategy: smartThreePileBot },
  { pileCount: 4, maxPile: 7, botStrategy: smartFourPileBot }
];

describe('smart pile-splitting bots', () => {
  it.each(smartBots)('never gives up a won position, on $pileCount piles', (
    { pileCount, maxPile, botStrategy }
  ) => {
    const wonBoards = boardsUpTo(pileCount, maxPile).filter(board => !isLosingForMover(board));
    expect(wonBoards.length).toBeGreaterThan(20);

    wonBoards.forEach(board => {
      // Each bot shuffles among equally-optimal turns, so one board has to hold
      // for every draw it can make.
      range(ITERATIONS).forEach(() => {
        const nextBoard = playSmartTurn(botStrategy, board);
        const handedOver = nextBoard.every(size => size === 1) || isLosingForMover(nextBoard);
        expect([board, handedOver]).toEqual([board, true]);
      });
    });
  });

  // A lost position has no turn that saves it, so the bot is only held to
  // playing a legal one — but it still has to, and the reductions are where that
  // is easiest to get wrong: three or four 2s halve to a board nobody can move
  // on, and [1, 2, 2, 2] tops up into one of them.
  it.each(smartBots)('plays a legal turn from a lost position, on $pileCount piles', (
    { pileCount, maxPile, botStrategy }
  ) => {
    const lostBoards = boardsUpTo(pileCount, maxPile).filter(board =>
      isLosingForMover(board) && range(board.length).some(id => isRemovalAllowed(board, id)));
    expect(lostBoards.length).toBeGreaterThan(5);

    lostBoards.forEach(board => range(ITERATIONS).forEach(() => {
      playSmartTurn(botStrategy, board);
    }));
  });

  // Both reductions recurse, so the deep end of each game's real range is worth
  // its own sweep: three piles start from 37 pieces, and four piles reach 24 in
  // a pile once the generator doubles a board.
  it.each(smartBots)('never gives up a won full-size position, on $pileCount piles', (
    { pileCount, botStrategy }
  ) => {
    const boards = range(400)
      .map(() => range(pileCount).map(() => random(1, 24)))
      .filter(board => !isLosingForMover(board));
    expect(boards.length).toBeGreaterThan(50);

    boards.forEach(board => {
      const nextBoard = playSmartTurn(botStrategy, board);
      const handedOver = nextBoard.every(size => size === 1) || isLosingForMover(nextBoard);
      expect([board, handedOver]).toEqual([board, true]);
    });
  });
});
