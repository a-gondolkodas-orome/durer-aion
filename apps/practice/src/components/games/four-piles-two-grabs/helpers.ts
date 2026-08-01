import { random, sample, sortBy } from 'lodash';

// Stones in each of the four piles.
export type Board = number[]; // length 4

// The amount removed from each pile in a single move. Exactly two entries are
// positive (the two chosen piles), the rest are 0.
export type Move = number[]; // length 4

// A player can move iff at least two piles are non-empty (a move needs two
// distinct non-empty piles). Otherwise they lose.
export const canMove = (board: Board): boolean =>
  board.filter(v => v > 0).length >= 2;

export const isTerminal = (board: Board): boolean => !canMove(board);

// Remove the chosen amount from each pile.
export const applyMove = (board: Board, move: Move): Board =>
  board.map((v, i) => v - move[i]);

// A move takes from exactly two piles, at least one stone and at most the whole
// pile from each. Checked directly rather than as membership in getLegalMoves,
// which enumerates a quadratic number of moves.
export const isMoveLegal = (board: Board, move: Move): boolean =>
  Array.isArray(move)
    && move.length === board.length
    && move.every((removed, i) => Number.isInteger(removed) && removed >= 0 && removed <= board[i])
    && move.filter(removed => removed > 0).length === 2;

// Every legal move: pick two non-empty piles, remove between 1 and the whole
// pile from each. Amounts removed from the two piles are independent.
export const getLegalMoves = (board: Board): Move[] => {
  const nonEmpty = board.map((v, i) => i).filter(i => board[i] > 0);
  const moves: Move[] = [];
  for (let a = 0; a < nonEmpty.length; a++) {
    for (let b = a + 1; b < nonEmpty.length; b++) {
      const i = nonEmpty[a], j = nonEmpty[b];
      for (let ri = 1; ri <= board[i]; ri++) {
        for (let rj = 1; rj <= board[j]; rj++) {
          const move = [0, 0, 0, 0];
          move[i] = ri;
          move[j] = rj;
          moves.push(move);
        }
      }
    }
  }
  return moves;
};

// A move wins immediately when it leaves the opponent unable to move (at most
// one non-empty pile remains).
export const isWinningInOneMove = (board: Board, move: Move): boolean =>
  isTerminal(applyMove(board, move));

// The player to move LOSES exactly when the three smallest piles are equal.
// (Verified against exhaustive minimax in helpers.spec.) Terminal positions –
// at most one non-empty pile – have three zero piles, so they satisfy this too.
const threeSmallestEqual = (board: Board): boolean => {
  const s = sortBy(board);
  return s[0] === s[1] && s[1] === s[2];
};

export const isWinningBoard = (board: Board): boolean => !threeSmallestEqual(board);

export const getSmartBotMove = (board: Board): Move => {
  // Winning moves leave the opponent with three equal smallest piles (a losing
  // position). Immediate wins (leaving the opponent unable to move) are a
  // special case, so prefer them to end the game promptly.
  const winning = getLegalMoves(board).filter(m => threeSmallestEqual(applyMove(board, m)));
  const immediate = winning.filter(m => isWinningInOneMove(board, m));
  if (immediate.length > 0) return sample(immediate)!;
  if (winning.length > 0) return sample(winning)!;
  // Losing position (three smallest already equal): every move hands the
  // opponent a winning position, so we cannot win against optimal play. Play
  // any legal move and hope the opponent slips up.
  return sample(getLegalMoves(board))!;
};

// Test bot: play a random legal move, but grab an immediate one-move win when
// one is available.
export const getRandomBotMove = (board: Board): Move => {
  const moves = getLegalMoves(board);
  const winningNow = moves.filter(m => isWinningInOneMove(board, m));
  return sample(winningNow.length > 0 ? winningNow : moves)!;
};

// --- Starting positions -----------------------------------------------------

const MIN_PER_PILE = 2;
const MAX_PER_PILE = 9;

const randomPile = (): number => random(MIN_PER_PILE, MAX_PER_PILE);

const shuffledPositions = (): number[] => {
  const p = [0, 1, 2, 3];
  for (let i = p.length - 1; i > 0; i--) {
    const j = random(0, i);
    [p[i], p[j]] = [p[j], p[i]];
  }
  return p;
};

// Half the starts are winning for the player to move (the three smallest piles
// are not all equal) and half are losing (three equal smallest piles), so each
// role wins with ~50% probability across random starts.
export const generateStartBoard = (): Board => {
  if (random(0, 1) === 0) {
    // Losing position: three piles equal to `base`, the fourth at least `base`.
    const base = random(MIN_PER_PILE, MAX_PER_PILE - 1);
    const big = random(base, MAX_PER_PILE);
    const [p0, p1, p2, p3] = shuffledPositions();
    const board = [0, 0, 0, 0];
    board[p0] = base;
    board[p1] = base;
    board[p2] = base;
    board[p3] = big;
    return board;
  }
  // Winning position: any four piles whose three smallest are not all equal.
  while (true) {
    const board = [randomPile(), randomPile(), randomPile(), randomPile()];
    if (isWinningBoard(board)) return board;
  }
};
