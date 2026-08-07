import { strategyGameFactory, type StrategyArgs } from 'strategy-game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { BoardClient } from './board-client';
import {
  generateArbitraryStartBoard, generateFixedStartBoard, generateTestStartBoard, moves,
  type Board, type TurnState
} from './gameplay';

const getPlayerStepDescription = ({ ctx: { turnState } }: StrategyArgs<Board, TurnState>) => {
  if (turnState !== null) {
    return {
      hu: 'Válassz a visszarakási lehetőségek közül.',
      en: 'Choose an option in the place back bar.'
    };
  }
  return {
    hu: 'Kattints egy érmére, hogy elvegyél egyet.',
    en: 'Click a coin to remove it.'
  };
};

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
