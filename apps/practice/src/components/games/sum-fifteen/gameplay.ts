import type { MoveOutcome, Ctx } from '../../strategy-game-factory';

// owner[i] holds who owns the number (i + 1): 0 = first player, 1 = second
// player, null = still available.
export type Owner = (0 | 1 | null)[]
export type Board = { owner: Owner }

export const allNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export const generateStartBoard = (): Board => ({ owner: Array(9).fill(null) });

export const numbersOwnedBy = (owner: Owner, player: 0 | 1): number[] =>
  allNumbers.filter(n => owner[n - 1] === player);

export const freeNumbers = (owner: Owner): number[] =>
  allNumbers.filter(n => owner[n - 1] === null);

// A player may claim any of 1..9 that nobody has claimed yet. Both players draw
// from the same nine numbers, so whose turn it is does not enter into legality.
const isChoiceAllowed = (owner: Owner, n: number): boolean =>
  Number.isInteger(n) && n >= 1 && n <= allNumbers.length && owner[n - 1] === null;

// The first player owns numbers on even move counts, so the player to move is
// simply the parity of how many numbers have been claimed.
export const currentPlayerFromOwner = (owner: Owner): 0 | 1 =>
  (owner.filter(o => o !== null).length % 2) as 0 | 1;

// Does any three of the given numbers add up to 15?
export const hasSum15 = (nums: number[]): boolean => {
  const n = nums.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let k = j + 1; k < n; k++) {
        if (nums[i] + nums[j] + nums[k] === 15) return true;
      }
    }
  }
  return false;
};

// The concrete triple summing to 15 (for highlighting the winning move), or null.
export const findWinningTriple = (nums: number[]): number[] | null => {
  const n = nums.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let k = j + 1; k < n; k++) {
        if (nums[i] + nums[j] + nums[k] === 15) return [nums[i], nums[j], nums[k]];
      }
    }
  }
  return null;
};

export const moves = {
  chooseNumber: {
    validate: (board: Board, _, n: number) => isChoiceAllowed(board.owner, n),
    apply: (board: Board, { ctx }: { ctx: Ctx }, n: number): MoveOutcome<Board> => {
      const player = ctx.currentPlayer as 0 | 1;
      const owner = board.owner.slice() as Board['owner'];
      owner[n - 1] = player;
      const nextBoard = { owner };

      if (hasSum15(numbersOwnedBy(owner, player))) {
        return { nextBoard, gameEnd: { winnerIndex: player } };
      }
      if (owner.every(o => o !== null)) {
        // All nine numbers claimed, nobody reached a triple summing to 15.
        return { nextBoard, gameEnd: { winnerIndex: 1 } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;
