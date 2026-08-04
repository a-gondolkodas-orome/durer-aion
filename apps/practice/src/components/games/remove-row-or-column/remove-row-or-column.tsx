import { sample } from 'lodash';
import { strategyGameFactory } from '../../strategy-game-factory';
import { BoardClient, getPlayerStepDescription } from './board-client';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { moves } from './helpers';
import { generateStartBoard as generateSingleBoard } from './single/helpers';
import { generateStartBoard as generateMultipleBoard } from './multiple/helpers';

const rule = {
  hu: <>
    A korongok egy vagy több (nem feltétlenül egyforma méretű) téglalapban vannak elhelyezve. A két
    játékos felváltva lép. Egy lépésben a soron lévő játékos kiválaszt egy korongokból álló
    téglalapot, és egy sorának vagy oszlopának minden korongját leveszi. (Korongokból álló
    téglalapnak egy olyan téglalap alakú területet nevezünk, ahol minden mezőn van korong, de
    közvetlenül mellette sehol.) Az nyer, aki az utolsó korongot elveszi.
  </>,
  en: <>
    The discs are arranged in one or more rectangles, not necessarily the same size. The two players
    move alternately. On a turn, the current player picks a solid rectangle of discs and removes
    every disc in one of its rows or one of its columns. (A rectangle of discs is a rectangular block
    where every cell has a disc and no cell directly next to it does.) Whoever removes the last disc
    wins.
  </>
};

const singleRule = {
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

const multipleRule = {
  hu: <>
    A játék kezdetén a korongok néhány (nem feltétlenül egyforma méretű) téglalapban vannak
    elhelyezve. A két játékos felváltva lép. Egy lépésben a soron lévő játékos kiválaszt egy
    korongokból álló téglalapot, és egy sorának vagy oszlopának minden korongját leveszi.
    (Korongokból álló téglalapnak egy olyan téglalap alakú területet nevezünk, ahol minden mezőn
    van korong, de közvetlenül mellette sehol.) Az nyer, aki az utolsó korongot elveszi.
  </>,
  en: <>
    At the start the discs are arranged in a few rectangles, not necessarily the same size. The two
    players move alternately. On a turn, the current player picks a solid rectangle of discs and
    removes every disc in one of its rows or one of its columns. (A rectangle of discs is a
    rectangular block where every cell has a disc and no cell directly next to it does.) Whoever
    removes the last disc wins.
  </>
};

// Test variant covers both sub-games: a single rectangle or several rectangles.
const generateTestStartBoard = () => sample([generateSingleBoard, generateMultipleBoard])!();

export const RemoveRowOrColumn = strategyGameFactory({
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
    // smart bot: optimal (Sprague–Grundy; moves to a zero position when winning)
    {
      botStrategy: smartBotStrategy,
      generateStartBoard: generateSingleBoard,
      rule: singleRule,
      label: { hu: '1 blokk (C)', en: '1 block (C)' },
      isDefault: true
    },
    {
      botStrategy: smartBotStrategy,
      generateStartBoard: generateMultipleBoard,
      rule: multipleRule,
      label: { hu: 'Több blokk (E)', en: 'Blocks (E)' }
    }
  ]
});
