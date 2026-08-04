import { random, sample, sum } from 'lodash';
import { strategyGameFactory } from '../../strategy-game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { BoardClient } from './board-client';
import { getPlayerStepDescription, isLostForMover, moves, type Board } from './helpers';

const generateWinningStartBoard = (): Board => {
  const board = [random(0, 5), random(0, 7), random(1, 8)];
  if (!isLostForMover(board) && sum(board) >= 4) return board;
  return generateWinningStartBoard();
};

const generateLosingStartBoard = (): Board => {
  const board = [random(0, 5), random(0, 7), random(1, 8)];
  if (isLostForMover(board) && sum(board) >= 4) return board;
  return generateLosingStartBoard();
};

// "Arbitrary" sub-game: a balanced (~50/50) heap of 1/2/3-pengő coins.
const generateArbitraryStartBoard = (): Board =>
  random(0, 1) ? generateWinningStartBoard() : generateLosingStartBoard();

// "Fixed" sub-game (the original "Change 15 coins"): 3×1, 5×2, 7×3.
const generateFixedStartBoard = (): Board => [3, 5, 7];

// Test variant covers both sub-games: a small arbitrary heap, or the fixed 3-5-7 setup.
const generateTestStartBoard = (): Board =>
  sample([
    (): Board => [random(0, 2), random(0, 2), random(1, 3)],
    generateFixedStartBoard
  ])!();

const rule = {
  hu: <>
    Van egy kupacban néhány érme, mindegyik 1, 2 vagy 3 pengős. Egy lépésben az
    éppen soron lévő játékos elvesz egy érmét a kupacból, és helyette berakhat egy darab kisebb
    értékű érmét, vagy dönthet úgy, hogy nem tesz be semmit. Az nyer, aki elveszi az utolsó érmét
    a kupacból.
  </>,
  en: <>
    There are some coins in a heap, of value 1, 2, or 3 pengő. In a move, the player
    may take a coin from the heap and put back a coin of smaller value in its place, or nothing.
    The winner is the one who takes the last coin from the heap.
  </>
};

const fixedRule = {
  hu: <>
    Egy kupacban 3 darab 1, 5 darab 2 és 7 darab 3 pengős érme van. Egy lépésben az
    éppen soron lévő játékos elvesz egy érmét a kupacból, és helyette berakhat egy darab kisebb
    értékű érmét, vagy dönthet úgy, hogy nem tesz be semmit. Az nyer, aki elveszi az utolsó érmét
    a kupacból.
  </>,
  en: <>
    There are three 1-pengő, five 2-pengő, and seven 3-pengő coins in a heap.
    In a move, the player takes a coin from the heap and puts back a coin of smaller value in its place,
    or nothing. The winner is the one who takes the last coin from the heap.
  </>
};

export const CoinsIn3Piles = strategyGameFactory({
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
      label: { hu: 'Teszt', en: 'Test' }
    },
    // smart bot: verified as optimal
    {
      botStrategy: smartBotStrategy,
      generateStartBoard: generateFixedStartBoard,
      rule: fixedRule,
      label: { hu: '3-5-7 (A)', en: '3-5-7 (A)' }
    },
    {
      botStrategy: smartBotStrategy,
      generateStartBoard: generateArbitraryStartBoard,
      label: { hu: 'Véletlen (B)', en: 'Random (B)' },
      isDefault: true
    }
  ]
});
