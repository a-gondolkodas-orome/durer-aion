import type { BotStrategy } from '../../../strategy-game-factory';
import { sample } from 'lodash';
import { type Board, type Moves } from './gameplay';

// The mover wins exactly when the last number said is even, so the only winning
// move is always x+1 (which hands the opponent an odd number). From 0 this plays
// the forced opening 1. From an odd (losing) board both moves hand the opponent an
// even, winning number, so play randomly to maximise the chance the human errs.
export const getBotNextNumber = (board: Board): number => {
  if (board % 2 === 0) return board + 1;
  return sample([board + 1, board * 2])!;
};

type Bot = BotStrategy<Board, Moves>

export const smartBotStrategy: Bot = ({ board }) => {
  const next = getBotNextNumber(board);
  if (next === board * 2) {
    return { move: 'double' };
  } else {
    return { move: 'increment' };
  }
};
