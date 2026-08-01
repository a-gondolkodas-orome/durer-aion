import { sample } from 'lodash';

// A 3x3 grid, row-major. 0 = empty, 1 | 2 | 3 = a written digit.
export type Board = number[]; // always length 9
export type Move = { cell: number; digit: number };

const rowOf = (cell: number): number => Math.floor(cell / 3);
const colOf = (cell: number): number => cell % 3;

export const generateStartBoard = (): Board => Array(9).fill(0);

export const isFull = (board: Board): boolean => board.every(v => v !== 0);

// Writing `digit` into empty `cell` is legal iff that digit is not already
// present in the cell's row or column (no row/column may hold two equal digits).
export const isLegalPlacement = (board: Board, cell: number, digit: number): boolean => {
  if (!Number.isInteger(cell) || cell < 0 || cell >= 9) return false;
  if (![1, 2, 3].includes(digit)) return false;
  if (board[cell] !== 0) return false;
  const r = rowOf(cell), c = colOf(cell);
  for (let k = 0; k < 3; k++) {
    if (board[r * 3 + k] === digit) return false;
    if (board[k * 3 + c] === digit) return false;
  }
  return true;
};

export const legalDigits = (board: Board, cell: number): number[] =>
  [1, 2, 3].filter(digit => isLegalPlacement(board, cell, digit));

export const legalMoves = (board: Board): Move[] => {
  const moves: Move[] = [];
  for (let cell = 0; cell < 9; cell++) {
    if (board[cell] !== 0) continue;
    for (const digit of legalDigits(board, cell)) moves.push({ cell, digit });
  }
  return moves;
};

export const applyMove = (board: Board, { cell, digit }: Move): Board =>
  board.map((v, i) => (i === cell ? digit : v));

// One placement per turn and player 0 starts, so the player to move is fixed by
// how many cells are already filled.
export const playerToMove = (board: Board): number =>
  board.filter(v => v !== 0).length % 2;

// The turn ends the game when the board is full (player 0 wins — the 9th
// placement is always theirs) or when the player to move has no legal move
// (they are stuck, so player 1 wins).
export const isTerminal = (board: Board): boolean =>
  isFull(board) || legalMoves(board).length === 0;

// Winner index (0 or 1) under optimal play from `board`, with `playerToMove`
// to move. The reachable state space is tiny (~1400 positions), so a memoised
// exhaustive minimax is both fast and provably optimal. Player 0 has a forced
// win from the empty board (see helpers.spec.ts / the written solution: reach a
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
