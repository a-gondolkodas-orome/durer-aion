import { strategyGameFactory } from '../../../game-factory';
import { BoardClient, moves, getPlayerStepDescription } from '../board-client';
import { smartBotStrategy, randomBotStrategy } from '../bot-strategy';
import { generateStartBoard } from './helpers';

const rule = {
  hu: <>
    A játék kezdetén egy n × k-as téglalap minden mezőjére teszünk egy-egy korongot. A két játékos
    felváltva lép. Egy lépésben a soron lévő játékos kiválaszt egy korongokból álló téglalapot, és
    egy sorának vagy oszlopának minden korongját leveszi. (Korongokból álló téglalapnak egy olyan
    téglalap alakú területet nevezünk, ahol minden mezőn van korong, de közvetlenül mellette sehol.
    Kezdetben csak egy ilyen téglalap van, később már lehet, hogy több is.) Az nyer, aki az utolsó
    korongot elveszi.
  </>,
  en: <>
    At the start, a disc is placed on every cell of an n × k rectangle. The two players move
    alternately. On a turn, the current player picks a solid rectangle of discs and removes every
    disc in one of its rows or one of its columns. (A rectangle of discs is a rectangular block where
    every cell has a disc and no cell directly next to it does. At the start there is only one such
    rectangle; later there may be several.) Whoever removes the last disc wins.
  </>
};

export const RemoveRowOrColumn = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt', en: 'Test' } },
    // smart bot: optimal (Sprague–Grundy; moves to a zero position when winning)
    {
      botStrategy: smartBotStrategy,
      generateStartBoard,
      label: { hu: 'Teljes', en: 'Full' },
      isDefault: true
    }
  ]
});
