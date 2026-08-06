import { sample } from 'lodash';
import type { BotStrategy } from '../../strategy-game-factory';
import {
  currentPlayerFromOwner,
  freeNumbers,
  hasSum15,
  numbersOwnedBy,
  type Board,
  type Moves,
  type Owner
} from './gameplay';

type Bot = BotStrategy<Board, Moves>

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

export const smartBotStrategy: Bot = ({ board, ctx }) => {
  const player = (ctx.currentPlayer ?? currentPlayerFromOwner(board.owner)) as 0 | 1;
  return { move: 'chooseNumber', args: [chooseSmartMove(board.owner, player)] };
};

export const randomBotStrategy: Bot = ({ board, ctx }) => {
  const player = (ctx.currentPlayer ?? currentPlayerFromOwner(board.owner)) as 0 | 1;
  return { move: 'chooseNumber', args: [chooseTestMove(board.owner, player)] };
};
