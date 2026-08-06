import { sample } from 'lodash';
import type { BotStrategy } from '../../strategy-game-factory';
import {
  applyMove,
  isFull,
  isTerminal,
  legalMoves,
  playerToMove,
  type Board,
  type Move,
  type Moves
} from './gameplay';

type Bot = BotStrategy<Board, Moves>

// Winner index (0 or 1) under optimal play from `board`, with `playerToMove`
// to move. The reachable state space is tiny (~1400 positions), so a memoised
// exhaustive minimax is both fast and provably optimal. Player 0 has a forced
// win from the empty board (see bot-strategy.spec.ts / the written solution: reach a
// "mixed rook arrangement" — a transversal holding all three digits).
const winnerCache = new Map<string, number>();

export const optimalWinner = (board: Board): number => {
  const key = board.join('');
  const cached = winnerCache.get(key);
  if (cached !== undefined) return cached;

  let winner: number;
  if (isFull(board)) {
    winner = 0;
  } else {
    const moves = legalMoves(board);
    if (moves.length === 0) {
      winner = 1;
    } else {
      const player = playerToMove(board);
      winner = moves.some(m => optimalWinner(applyMove(board, m)) === player)
        ? player
        : 1 - player;
    }
  }
  winnerCache.set(key, winner);
  return winner;
};

// Smart bot: keep a forced win when one exists. From a losing position every
// move hands the opponent a forced win, so play the reply that leaves the
// opponent the most losing continuations — the most rope for a non-optimal
// human to hang themselves with. Random tie-break.
export const getSmartBotStep = (board: Board): Move => {
  const me = playerToMove(board);
  const moves = legalMoves(board);

  const winningMoves = moves.filter(m => optimalWinner(applyMove(board, m)) === me);
  if (winningMoves.length > 0) return sample(winningMoves)!;

  const trapCount = (m: Move): number => {
    const next = applyMove(board, m);
    if (isTerminal(next)) return 0;
    // opponent replies that (mistakenly) hand the game back to the bot
    return legalMoves(next).filter(om => optimalWinner(applyMove(next, om)) === me).length;
  };
  const scored = moves.map(m => ({ m, traps: trapCount(m) }));
  const maxTraps = Math.max(...scored.map(s => s.traps));
  return sample(scored.filter(s => s.traps === maxTraps))!.m;
};

// Test bot: play a random legal move, but grab an immediate win (a move that
// ends the game in the bot's favour right now) whenever one is available.
export const getRandomBotStep = (board: Board): Move => {
  const me = playerToMove(board);
  const moves = legalMoves(board);

  const immediateWins = moves.filter(m => {
    const next = applyMove(board, m);
    if (isFull(next)) return me === 0; // filled the grid -> player 0 wins
    if (legalMoves(next).length === 0) return me === 1; // opponent stuck -> player 1 wins
    return false;
  });
  if (immediateWins.length > 0) return sample(immediateWins)!;

  return sample(moves)!;
};

export const smartBotStrategy: Bot = ({ board }) => {
  const { cell, digit } = getSmartBotStep(board);
  return { move: 'placeDigit', args: [cell, digit] };
};

export const randomBotStrategy: Bot = ({ board }) => {
  const { cell, digit } = getRandomBotStep(board);
  return { move: 'placeDigit', args: [cell, digit] };
};
