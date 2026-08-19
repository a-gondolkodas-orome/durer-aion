import { uniq, sample } from 'lodash';
import type { BotStrategy } from 'strategy-game-factory';
import { type Board, type Moves } from './gameplay';

type Move = { k: number, l: number, resultSet: number[] }

export const distinctValues = (board: Board): number[] => uniq(board).sort((a, b) => a - b);

const movesFromSet = (set: number[]): Move[] => {
  const result: Move[] = [];
  for (const k of set) {
    for (let l = 1; l < k; l++) {
      const resultSet = uniq([...set.filter(v => v !== k), l]).sort((a, b) => a - b);
      result.push({ k, l, resultSet });
    }
  }
  return result;
};

const isWinningMove = (move: Move): boolean =>
  // reaching a single value wins immediately; otherwise a move is winning when it
  // leaves the opponent in a losing position.
  move.resultSet.length === 1 || !playerToMoveWins(move.resultSet);

// The exhaustive answer, for reference: the sets losing for the player to move
// are {1,2,3} over values 1..4, and {1,2,3}, {1,4,5}, {2,3,4,5}, {1,2,3,4,5}
// over values 1..5. Every other set is a win, driven towards one of those.
const winMemo: Record<string, boolean> = {};
const playerToMoveWins = (set: number[]): boolean => {
  const key = set.join(',');
  if (key in winMemo) return winMemo[key];
  // Guard against self-reference before the result is memoised (the recursion is
  // acyclic since every move strictly decreases the coin values, but be safe).
  winMemo[key] = false;
  const wins = movesFromSet(set).some(isWinningMove);
  return (winMemo[key] = wins);
};

// Smart bot: play the winning move when one exists (drive towards a losing
// position, or merge to a single value). In a losing position, make the reply
// that leaves the opponent with the most ways to blunder.
type Bot = BotStrategy<Board, Moves>

export const smartBotStrategy: Bot = ({ board }) => {
  const candidateMoves = movesFromSet(distinctValues(board));

  const winningMoves = candidateMoves.filter(isWinningMove);
  if (winningMoves.length > 0) {
    const move = sample(winningMoves)!;
    return { move: 'convert', args: [move.k, move.l] };
  }

  const blunderRoom = (move: Move) => {
    const opponentMoves = movesFromSet(move.resultSet);
    return opponentMoves.filter(m => !isWinningMove(m)).length;
  };
  const rooms = candidateMoves.map(blunderRoom);
  const maxRoom = Math.max(...rooms);
  const bestMoves = candidateMoves.filter((_, i) => rooms[i] === maxRoom);
  const move = sample(bestMoves)!;
  return { move: 'convert', args: [move.k, move.l] };
};

// Test bot: play a random legal move, but grab an immediate win when available.
export const randomBotStrategy: Bot = ({ board }) => {
  const candidateMoves = movesFromSet(distinctValues(board));
  const winningNow = candidateMoves.filter(m => m.resultSet.length === 1);
  const move = sample(winningNow.length > 0 ? winningNow : candidateMoves)!;
  return { move: 'convert', args: [move.k, move.l] };
};
