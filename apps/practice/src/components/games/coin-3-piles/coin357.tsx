import { strategyGameFactory } from '../../game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { BoardClient } from './board-client';
import { getPlayerStepDescription, moves, type Board } from './helpers';

const rule = {
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

export const Coin357 = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt 🤖', en: 'Test 🤖' } },
    {
      // smart bot: verified as optimal
      botStrategy: smartBotStrategy,
      generateStartBoard: (): Board => ([3, 5, 7]),
      label: { hu: 'Okos 🤖', en: 'Smart 🤖' },
      isDefault: true
    }
  ]
});
