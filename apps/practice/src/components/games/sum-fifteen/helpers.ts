import { sample } from 'lodash';

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
export const isChoiceAllowed = (owner: Owner, n: number): boolean =>
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

// Winner (0 or 1) with optimal play from the given position. There are no draws:
// if the board fills with no triple summing to 15, the second player (1) wins.
//
// This game is tic-tac-toe in disguise — via the magic square, three numbers sum
// to 15 iff they form a line — so optimal play is a draw and the second player
// always wins. The state space is tiny (< 3^9), so we just memoise a full search.
const memo = new Map<string, 0 | 1>();

const key = (owner: Owner) => owner.map(o => (o === null ? '.' : o)).join('');

// Winner if `player` claims `n` from this position, then play continues optimally.
const outcomeAfterMove = (owner: Owner, n: number, player: 0 | 1): 0 | 1 => {
  const next = owner.slice();
  next[n - 1] = player;
  if (hasSum15(numbersOwnedBy(next, player))) return player;
  if (next.every(o => o !== null)) return 1;
  return winnerOptimal(next);
};

export const winnerOptimal = (owner: Owner): 0 | 1 => {
  const cached = memo.get(key(owner));
  if (cached !== undefined) return cached;

  const cp = currentPlayerFromOwner(owner);
  // If the current player cannot force their own win, the opponent wins.
  let result: 0 | 1 = (1 - cp) as 0 | 1;
  for (const n of freeNumbers(owner)) {
    if (outcomeAfterMove(owner, n, cp) === cp) {
      result = cp;
      break;
    }
  }
  memo.set(key(owner), result);
  return result;
};

// Optimal move for the bot. Wins immediately when possible; otherwise keeps a
// forced win if it has one; otherwise (a losing position) plays the move that
// leaves the opponent the fewest winning replies, maximising the chance a human
// slips up. This naturally blocks the opponent's immediate threats.
export const chooseSmartMove = (owner: Owner, currentPlayer: 0 | 1): number => {
  const free = freeNumbers(owner);
  const mine = numbersOwnedBy(owner, currentPlayer);

  const immediateWins = free.filter(n => hasSum15([...mine, n]));
  if (immediateWins.length > 0) return sample(immediateWins)!;

  const winningMoves = free.filter(n => outcomeAfterMove(owner, n, currentPlayer) === currentPlayer);
  if (winningMoves.length > 0) return sample(winningMoves)!;

  // Losing position: play the toughest defence. Rank moves lexicographically —
  // (1) don't lose outright by filling the board, (2) don't hand the opponent an
  // immediate winning reply (i.e. block their threats), (3) among the safe moves,
  // leave the opponent the fewest winning continuations.
  const opponent = (1 - currentPlayer) as 0 | 1;
  const rankOf = (n: number): number => {
    const next = owner.slice();
    next[n - 1] = currentPlayer;
    const freeAfter = freeNumbers(next);
    const fillLoss = freeAfter.length === 0 ? 1 : 0;
    const opponentNums = numbersOwnedBy(next, opponent);
    const givesImmediateWin = freeAfter.some(m => hasSum15([...opponentNums, m])) ? 1 : 0;
    const winningReplies = freeAfter.filter(m => outcomeAfterMove(next, m, opponent) === opponent).length;
    return fillLoss * 1000 + givesImmediateWin * 100 + winningReplies;
  };
  const ranks = free.map(rankOf);
  const min = Math.min(...ranks);
  const leastBad = free.filter((_, i) => ranks[i] === min);
  return sample(leastBad)!;
};

// Test bot: plays randomly, but grabs an immediate win when one is available.
export const chooseTestMove = (owner: Owner, currentPlayer: 0 | 1): number => {
  const free = freeNumbers(owner);
  const mine = numbersOwnedBy(owner, currentPlayer);
  const immediateWins = free.filter(n => hasSum15([...mine, n]));
  return sample(immediateWins.length > 0 ? immediateWins : free)!;
};
