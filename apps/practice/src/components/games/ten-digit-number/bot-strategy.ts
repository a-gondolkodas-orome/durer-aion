import { sample } from 'lodash';
import type { BotStrategy } from '../../strategy-game-factory';
import { availableDigits, totalDigits, type Board, type Moves } from './gameplay';

// Precompute winner(sumMod9, turnsLeft): 0 = Jenő wins, 1 = Béla wins, with optimal play.
// Jenő is player 0 (first mover), Béla is player 1.
// Béla wins iff the final digit sum ≡ 0 (mod 9).
const winnerFromState = (() => {
  const memo = {};
  const compute = (sumMod9, turnsLeft) => {
    const key = `${sumMod9},${turnsLeft}`;
    if (key in memo) return memo[key];
    if (turnsLeft === 0) return (memo[key] = sumMod9 === 0 ? 1 : 0);
    const currentPlayer = (totalDigits - turnsLeft) % 2;
    for (const d of availableDigits) {
      if (compute((sumMod9 + d) % 9, turnsLeft - 1) === currentPlayer) {
        return (memo[key] = currentPlayer);
      }
    }
    return (memo[key] = 1 - currentPlayer);
  };
  for (let t = 0; t <= totalDigits; t++) for (let s = 0; s < 9; s++) compute(s, t);
  return (sumMod9, turnsLeft) => memo[`${sumMod9},${turnsLeft}`];
})();

type Bot = BotStrategy<Board, Moves>

export const randomBotStrategy: Bot = ({ board }) => {
  const turnsLeft = totalDigits - board.digits.length;
  const currentPlayer = (totalDigits - turnsLeft) % 2;

  if (turnsLeft === 1) {
    const winningDigits = availableDigits.filter(
      d => winnerFromState((board.sumMod9 + d) % 9, 0) === currentPlayer
    );
    return {
      move: 'chooseDigit',
      args: [sample(winningDigits.length > 0 ? winningDigits : availableDigits)!]
    };
  }

  return { move: 'chooseDigit', args: [sample(availableDigits)!] };
};

export const smartBotStrategy: Bot = ({ board }) => {
  const turnsLeft = totalDigits - board.digits.length;
  const currentPlayer = (totalDigits - turnsLeft) % 2;

  const winningDigits = availableDigits.filter(
    d => winnerFromState((board.sumMod9 + d) % 9, turnsLeft - 1) === currentPlayer
  );
  if (winningDigits.length > 0) {
    return { move: 'chooseDigit', args: [sample(winningDigits)!] };
  }

  // Losing position: minimise opponent's winning replies, pick randomly among equally bad moves.
  const opponentWinCount = d => {
    const nextSumMod9 = (board.sumMod9 + d) % 9;
    if (turnsLeft < 2) return 0;
    return availableDigits.filter(
      d2 => winnerFromState((nextSumMod9 + d2) % 9, turnsLeft - 2) === (1 - currentPlayer)
    ).length;
  };
  const counts = availableDigits.map(opponentWinCount);
  const minCount = Math.min(...counts);
  const leastBadDigits = availableDigits.filter((_, i) => counts[i] === minCount);
  return { move: 'chooseDigit', args: [sample(leastBadDigits)!] };
};
