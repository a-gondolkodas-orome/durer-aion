import { sample } from 'lodash';
import type { BotStrategy } from 'strategy-game-factory';
import { type Board, type Moves } from './gameplay';

const digitsOf = (n: number): number[] =>
  String(n).split('').map(Number).filter(d => d !== 0);

const uniqueNonZeroDigits = (n: number): number[] =>
  [...new Set(digitsOf(n))];

type Bot = BotStrategy<Board, Moves>

export const randomBotStrategy: Bot = ({ board }) => {
  const digits = uniqueNonZeroDigits(board);
  const winningDigits = digits.filter(d => board - d === 0);
  return { move: 'subtractDigit', args: [sample(winningDigits.length > 0 ? winningDigits : digits)!] };
};

export const smartBotStrategy: Bot = ({ board }) => {
  if (board % 10 !== 0) {
    return { move: 'subtractDigit', args: [board % 10] };
  } else {
    return { move: 'subtractDigit', args: [sample(uniqueNonZeroDigits(board))!] };
  }
};
