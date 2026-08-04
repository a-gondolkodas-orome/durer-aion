import type { BotStrategy } from '../../../strategy-game-factory';
import { sample } from 'lodash';
import { allPrimePowers, type Board, type Moves } from './gameplay';

type Bot = BotStrategy<Board, Moves>

export const randomBotStrategy: Bot = ({ board }) => {
  const validMoves = allPrimePowers.filter(e => e.value <= board);
  const { prime, exponent } = sample(validMoves)!;
  return { move: 'subtractPrimeExponent', args: [{ prime, exponent }] };
};

export const smartBotStrategy: Bot = ({ board }) => {
  if (board === 1) {
    return { move: 'subtractPrimeExponent', args: [{ prime: 2, exponent: 0 }] };
  }

  const validMoves = allPrimePowers.filter(({ value }) => value <= board);

  let chosenPrime;
  let chosenExponent;

  if (board % 6 === 0) {
    ({ prime: chosenPrime, exponent: chosenExponent } = sample(validMoves)!);
  } else {
    const possibleMoves = validMoves.filter(({ value }) => (board - value) % 6 === 0);
    ({ prime: chosenPrime, exponent: chosenExponent } = sample(possibleMoves)!);
  }
  return { move: 'subtractPrimeExponent', args: [{ prime: chosenPrime, exponent: chosenExponent }] };
};
