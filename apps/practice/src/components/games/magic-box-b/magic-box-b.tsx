import { strategyGameFactory, type Events, type Ctx } from '../../game-factory';
import { BoardClient } from './board-client';
import { generateEmptyBoard, isLineFull, placeStoneAt, type Board } from './helpers';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';

const moves = {
  placeStone: (board: Board, _, cellId) => {
    const nextBoard: Board = { stones: placeStoneAt(board.stones, cellId), pendingLine: null };
    return { nextBoard };
  },

  designateLine: (board: Board, { ctx, events }: { ctx: Ctx, events: Events }, lineIndex) => {
    const nextBoard: Board = { stones: board.stones, pendingLine: lineIndex };
    if (isLineFull(nextBoard.stones, lineIndex)) {
      events.endGame(ctx.currentPlayer === 0 ? 0 : 1);
    } else {
      events.endTurn();
    }
    return { nextBoard };
  }
};

const rule = {
  hu: <>
    A mágikus ládában kilenc rekesz van 3×3-as elrendezésben. Két játékos felváltva pakol köveket a
    láda rekeszeibe, minden rekeszbe legfeljebb egy kő rakható. Az egyik játékos kijelöl egy sort vagy
    oszlopot, és a másik játékosnak ebbe a sorba vagy oszlopba kell raknia egy követ. Ezután a szerepek
    megfordulnak: aki most rakott le egy követ, kijelöl egy sort vagy oszlopot a másiknak, és ez így
    ismétlődik felváltva. A játék akkor ér véget, ha valaki nem tud követ lerakni a kijelölt sorba vagy
    oszlopba — ő veszít. Az elején eldönthetitek, hogy ki rakja le az első követ, és ki jelöl ki
    elsőként sort vagy oszlopot.
  </>,
  en: <>
    The magic box has nine compartments in a 3×3 grid. Two players alternately place stones into the
    compartments, at most one stone per compartment. One player designates a row or column, and the
    other player must place a stone into it. Then the roles swap: whoever just placed a stone now
    designates a row or column for the other player, and this keeps alternating. The game ends when a
    player can't place a stone into the designated row or column — that player loses. At the start,
    you can choose whether you place the first stone, or designate the first row/column.
  </>
};

export const MagicBoxB = strategyGameFactory({
  presentation: {
    rule,
    /*
    Only the first player can move first in the framework implementation, but
    the rule says the second player moves first, meaning they make a line
    designation move, and then the first player will make a stone placement move
    */
    roleLabels: [
      { hu: 'Másodszor rakok', en: "I'll place second" },
      { hu: 'Először rakok', en: "I'll place first" }
    ],
    getPlayerStepDescription: ({ board }) => {
      if (board.pendingLine === null) {
        return {
          hu: 'Jelölj ki egy sort vagy oszlopot, ahova az ellenfélnek a következő követ kell raknia.',
          en: 'Designate a row or column where your opponent must place their next stone.'
        };
      }
      return {
        hu: 'Helyezz le egy kavicsot a kijelölt sorba vagy oszlopba.',
        en: 'Place a stone into the designated row or column.'
      };
    }
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt 🤖', en: 'Test 🤖' } },
    {
      // smart bot: verified as optimal
      botStrategy: smartBotStrategy,
      generateStartBoard: generateEmptyBoard,
      label: { hu: 'Okos 🤖', en: 'Smart 🤖' },
      isDefault: true
    }
  ]
});
