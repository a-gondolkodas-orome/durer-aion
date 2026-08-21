import type { BotStrategy } from 'strategy-game-factory';
import { reverse, sample } from 'lodash';
import { getAvailableExponents, type Board, type Moves } from './gameplay';

type Bot = BotStrategy<Board, Moves>

export const randomBotStrategy: Bot = ({ board }) =>
  ({ move: 'subtractPowerOfTwo', args: [sample(getAvailableExponents(board))!] });

export const smartBotStrategy: Bot = ({ board }) => {
  if (board === 1) {
    return { move: 'subtractPowerOfTwo', args: [0] };
  }
  const availableExponents = getAvailableExponents(board);
  if (board % 3 === 0) {
    return { move: 'subtractPowerOfTwo', args: [sample(availableExponents)!] };
  } else {
    // board % 3 is 1 or 2 here, and 2**e alternates 1, 2, 1, 2 (mod 3), so
    // e = 0 or e = 1 always lands on a multiple of 3 — both are available
    // whenever board >= 2, which the board === 1 branch above guarantees.
    const optimalMove = reverse(availableExponents).find(e => (board - 2 ** e) % 3 === 0)!;
    return { move: 'subtractPowerOfTwo', args: [optimalMove] };
  }
}
