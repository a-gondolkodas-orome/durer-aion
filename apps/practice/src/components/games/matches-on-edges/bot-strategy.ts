import { sample } from 'lodash';
import type { StrategyArgs } from '../../game-factory';
import {
  type Board,
  type Move,
  applyMove,
  blockMultiset,
  isTerminal,
  legalMoves,
  moverWins
} from './helpers';

// A move is winning if it leaves the other player (who moves next) in a losing
// position.
const winningMoves = (board: Board, legal: Move[], memo: Map<string, boolean>): Move[] =>
  legal.filter(m => !moverWins(blockMultiset(applyMove(board, m.a, m.b)), memo));

// How many of the other player's replies would keep them winning. Used only when
// we are already losing: play the move that gives them the fewest correct
// answers, maximising the chance a fallible opponent slips up.
const opponentWinningReplies = (board: Board, move: Move, memo: Map<string, boolean>): number => {
  const afterOurMove = applyMove(board, move.a, move.b);
  return winningMoves(afterOurMove, legalMoves(afterOurMove), memo).length;
};

// Optimal bot: verified against the official characterisation (see
// bot-strategy.spec.ts). Plays a winning move when one exists, otherwise sets
// the hardest possible trap.
export const smartBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  const memo = new Map<string, boolean>();
  const legal = legalMoves(board);
  const winning = winningMoves(board, legal, memo);

  let chosen: Move;
  if (winning.length > 0) {
    chosen = sample(winning)!;
  } else {
    const scored = legal.map(m => ({ m, replies: opponentWinningReplies(board, m, memo) }));
    const fewest = Math.min(...scored.map(s => s.replies));
    chosen = sample(scored.filter(s => s.replies === fewest))!.m;
  }
  moves.placeWindow(board, chosen.a, chosen.b);
};

// Test bot: plays at random, but takes an immediately winning move (one that
// leaves the other player unable to move) when one is available.
export const randomBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  const legal = legalMoves(board);
  const immediateWin = legal.find(m => isTerminal(applyMove(board, m.a, m.b)));
  const chosen = immediateWin ?? sample(legal)!;
  moves.placeWindow(board, chosen.a, chosen.b);
};
