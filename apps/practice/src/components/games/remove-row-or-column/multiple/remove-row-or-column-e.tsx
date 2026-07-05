import { strategyGameFactory } from '../../../game-factory';
import { BoardClient, moves, getPlayerStepDescription } from '../board-client';
import { smartBotStrategy, randomBotStrategy } from '../bot-strategy';
import { generateStartBoard } from './helpers';

// Sibling of "Remove a row or column" (category C): identical mechanics, but the
// start position is several isolated rectangles instead of a single one. The
// flood-fill engine and Sprague–Grundy bot in ../ already handle a board of many
// rectangles, so only the start board and rule differ.
const rule = {
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

export const RemoveRowOrColumnE = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt 🤖', en: 'Test 🤖' } },
    // smart bot: optimal (Sprague–Grundy; moves to a zero position when winning)
    {
      botStrategy: smartBotStrategy,
      generateStartBoard,
      label: { hu: 'Okos 🤖', en: 'Smart 🤖' },
      isDefault: true
    }
  ]
});
