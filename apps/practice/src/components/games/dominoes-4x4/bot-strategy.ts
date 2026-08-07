import { sample } from 'lodash';
import type { BotStrategy } from 'strategy-game-factory';
import { type Board, type Domino, BOARDSIZE, type Moves } from './gameplay';

type Bot = BotStrategy<Board, Moves>

// This game is Domineering on a 4x4 board: player 0 (Árgyélus) only ever places
// vertical dominoes, player 1 (Félix) only horizontal ones. It is a partizan game
// (the two players have different move sets), so the Sprague-Grundy machinery used by
// the sibling Cram game does not apply. Instead we solve it exactly with a plain
// memoized minimax over the 4x4 occupancy bitmask (16 bits): only 2^16 * 2 states
// exist, so the whole game tree is tiny and fully cached after the first call.

const cellIndex = (row: number, col: number) => row * BOARDSIZE + col;

const boardToMask = (board: Board): number => {
  let mask = 0;
  for (const domino of board) {
    for (const { row, col } of domino) mask |= 1 << cellIndex(row, col);
  }
  return mask;
};

type MaskMove = { domino: Domino; mask: number };

// All legal placements for `player` given the occupied-cell `mask`.
// player 0 places vertical dominoes (two cells in the same column),
// player 1 places horizontal dominoes (two cells in the same row).
const movesForPlayer = (mask: number, player: number): MaskMove[] => {
  const result: MaskMove[] = [];
  for (let row = 0; row < BOARDSIZE; row++) {
    for (let col = 0; col < BOARDSIZE; col++) {
      const [dRow, dCol] = player === 0 ? [1, 0] : [0, 1];
      const nextRow = row + dRow;
      const nextCol = col + dCol;
      if (nextRow >= BOARDSIZE || nextCol >= BOARDSIZE) continue;
      const a = 1 << cellIndex(row, col);
      const b = 1 << cellIndex(nextRow, nextCol);
      if ((mask & a) || (mask & b)) continue;
      result.push({
        domino: [{ row, col }, { row: nextRow, col: nextCol }],
        mask: mask | a | b
      });
    }
  }
  return result;
};

// Normal play: the player who cannot move loses. Returns true iff the player to move
// can force a win from this position.
const winMemo = new Map<number, boolean>();

const canWin = (mask: number, player: number): boolean => {
  const key = mask * 2 + player;
  const cached = winMemo.get(key);
  if (cached !== undefined) return cached;

  let win = false;
  for (const move of movesForPlayer(mask, player)) {
    if (!canWin(move.mask, 1 - player)) { win = true; break; }
  }
  winMemo.set(key, win);
  return win;
};

// Exposed for tests: is the position a win for the player to move?
export const isWinningForPlayerToMove = (board: Board, player: number): boolean =>
  canWin(boardToMask(board), player);

export const smartBotStrategy: Bot = ({ board, ctx }) => {
  const player = ctx.currentPlayer!;
  const mask = boardToMask(board);
  const candidates = movesForPlayer(mask, player);

  const winningMoves = candidates.filter(move => !canWin(move.mask, 1 - player));
  if (winningMoves.length > 0) {
    return { move: 'placeDomino', args: [sample(winningMoves)!.domino] };
  }

  // Losing position (every move loses against perfect play): play the move that leaves
  // the opponent the fewest winning replies, to maximize the chance they slip up.
  let fewestOpponentWins = Infinity;
  let bestMoves: MaskMove[] = [];
  for (const move of candidates) {
    const opponentWins = movesForPlayer(move.mask, 1 - player)
      .filter(reply => !canWin(reply.mask, player)).length;
    if (opponentWins < fewestOpponentWins) {
      fewestOpponentWins = opponentWins;
      bestMoves = [move];
    } else if (opponentWins === fewestOpponentWins) {
      bestMoves.push(move);
    }
  }
  return { move: 'placeDomino', args: [sample(bestMoves)!.domino] };
};

// Test bot: plays randomly, but grabs an immediate win (a move after which the other
// player has no legal placement) whenever one is available.
export const randomBotStrategy: Bot = ({ board, ctx }) => {
  const player = ctx.currentPlayer!;
  const mask = boardToMask(board);
  const candidates = movesForPlayer(mask, player);

  const immediateWins = candidates.filter(
    move => movesForPlayer(move.mask, 1 - player).length === 0
  );
  const chosen = sample(immediateWins.length > 0 ? immediateWins : candidates)!;
  return { move: 'placeDomino', args: [chosen.domino] };
};
