import { describe, it, expect } from 'vitest';
import { sample } from 'lodash';
import { botNextMoveArgs, makeCtx } from '../../../test-utils';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import {
  type Board,
  applyMove,
  emptyBoard,
  isTerminal,
  legalMoves,
  moverWins,
  blockMultiset,
  secondPlayerWins
} from './gameplay';

// Run a bot strategy on `board` and read back the move it named.
const runBot = (
  strategy: typeof smartBotStrategy,
  board: Board
): { a: number; b: number } => {
  const [a, b] = botNextMoveArgs(strategy({ board, ctx: makeCtx() }));
  return { a, b };
};

// Perfect adversary: pick a move leaving the opponent losing if possible.
const perfectMove = (board: Board): { a: number; b: number } => {
  const legal = legalMoves(board);
  const winning = legal.filter(m => !moverWins(blockMultiset(applyMove(board, m.a, m.b))));
  return sample(winning.length ? winning : legal)!;
};

// Play a full game; player 0 moves first. Returns the winner index.
const playGame = (n: number, botSide: number): number => {
  let board = emptyBoard(n);
  let current = 0;
  for (let guard = 0; guard < 500; guard++) {
    if (isTerminal(board)) return 1 - current; // current player cannot move and loses
    const move = current === botSide
      ? runBot(smartBotStrategy, board)
      : perfectMove(board);
    board = applyMove(board, move.a, move.b);
    current = 1 - current;
  }
  throw new Error('game did not terminate');
};

describe('smart bot plays optimally', () => {
  it('wins every game from the winning side against a perfect adversary', () => {
    for (let n = 5; n <= 17; n++) {
      const botSide = secondPlayerWins(n) ? 1 : 0;
      for (let rep = 0; rep < 8; rep++) {
        expect(playGame(n, botSide)).toBe(botSide);
      }
    }
  });

  it('always chooses a legal move on every reachable position', () => {
    const check = (board: Board, depth: number) => {
      if (isTerminal(board) || depth > 40) return;
      const legal = legalMoves(board);
      const move = runBot(smartBotStrategy, board);
      expect(legal.some(m => m.a === move.a && m.b === move.b)).toBe(true);
      // walk one perfect-adversary reply forward to keep exploring real lines
      const next = applyMove(board, move.a, move.b);
      if (!isTerminal(next)) check(applyMove(next, perfectMove(next).a, perfectMove(next).b), depth + 2);
    };
    for (let n = 5; n <= 15; n++) check(emptyBoard(n), 0);
  });
});

describe('test bot', () => {
  it('always makes a legal move and grabs an immediate win when available', () => {
    for (let n = 5; n <= 13; n++) {
      const board = emptyBoard(n);
      const move = runBot(randomBotStrategy, board);
      expect(legalMoves(board).some(m => m.a === move.a && m.b === move.b)).toBe(true);
    }

    // A single length-2 block left (rest inert): the size-1 move that empties it
    // wins immediately, and the test bot must take it.
    const oneMoveWin: Board = { n: 4, edges: [true, false, true] };
    // blocks: cell 0 (len 1), cells 1-2 (len 2), cell 3 (len 1)
    const move = runBot(randomBotStrategy, oneMoveWin);
    expect(isTerminal(applyMove(oneMoveWin, move.a, move.b))).toBe(true);
  });
});
