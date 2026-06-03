import { random, sum } from 'lodash';
import { strategyGameFactory } from '../../game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { BoardClient } from './board-client';
import { getPlayerStepDescription, isWinningState, moves, type Board } from './helpers';

const generateTestStartBoard = (): Board => [random(0, 2), random(0, 2), random(1, 3)];

const generateStartBoard = (): Board => {
  if (random(0, 1)) {
    return generateWinningStartBoard();
  } else {
    return generateLosingStartBoard();
  }
};

const generateWinningStartBoard = (): Board => {
  const board = [random(0, 5), random(0, 7), random(1, 8)];
  if (!isWinningState({ board }) && sum(board) >= 4) return board;
  return generateWinningStartBoard();
}

const generateLosingStartBoard = (): Board => {
  const board = [random(0, 5), random(0, 7), random(1, 8)];
  if (isWinningState({ board }) && sum(board) >= 4) return board;
  return generateLosingStartBoard();
}

const rule = {
  hu: <>
    Van egy kupacban néhány érme, mindegyik 1, 2 vagy 3 pengős. Egy lépésben az
    éppen soron lévő játékos elvesz egy érmét a kupacból, és helyette berakhat egy darab kisebb
    értékű érmét, vagy dönthet úgy, hogy nem tesz be semmit. Az nyer, aki elveszi az utolsó érmét
    a kupacból.
  </>,
  en: <>
    There are some coins in the heap, of value 1, 2, or 3 pengő. In a move, the player
    may take a coin from the heap and replace a coin of smaller value, or not replace anything.
    The winner is the one who takes the last coin from the heap.
  </>
};

export const Coin123 = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      generateStartBoard: generateTestStartBoard,
      label: { hu: 'Teszt 🤖', en: 'Test 🤖' }
    },
    // smart bot: verified as optimal
    { botStrategy: smartBotStrategy, generateStartBoard, label: { hu: 'Okos 🤖', en: 'Smart 🤖' }, isDefault: true }
  ]
});
