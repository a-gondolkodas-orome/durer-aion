import { strategyGameFactory, type Ctx, type Events } from '../../game-factory';
import { BoardClient } from './board-client';
import { type Board, applyMove, currentWindowSize, generateStartBoard, isTerminal } from './helpers';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';

const moves = {
  // Place the length-k subtable [a, b]: matches go on its free bounding edges.
  // If that leaves the other player with no legal move, they lose; otherwise the
  // turn passes.
  placeWindow: (board: Board, { ctx, events }: { ctx: Ctx; events: Events }, a: number, b: number) => {
    const nextBoard = applyMove(board, a, b);
    if (isTerminal(nextBoard)) {
      events.endGame(ctx.currentPlayer!);
    } else {
      events.endTurn();
    }
    return { nextBoard };
  }
};

const rule = {
  hu: <>
    Egy 1 × n-es tábla szomszédos mezőit n − 1 elválasztó él határolja el egymástól, melyeken kezdetben
    nincs gyufa. Egy 0 &lt; k &lt; n méretű lépés során a soron lévő játékos kiválaszt egy 1 × k-as
    résztáblát, mely a belsejében nem tartalmaz gyufát, és a résztáblát határoló gyufa nélküli elválasztó
    élekre rárak egyet-egyet. A lépés akkor szabályos, ha a határoló elválasztó élek közül legalább az
    egyiken még nem volt gyufa, továbbá vagy k = 1, vagy k osztható 4-gyel. A két játékos felváltva lép,
    és a soron következő játékosnak a legnagyobb 0 &lt; k &lt; n méretű szabályos lépései közül kell
    meglépnie az egyiket. A játéknak akkor van vége, ha valaki nem tud szabályosan lépni: ő veszít.
  </>,
  en: <>
    On a 1 × n strip, adjacent cells are separated by n − 1 dividing edges, which start out with no
    matches on them. In a move of size 0 &lt; k &lt; n the player to move picks a 1 × k subtable whose
    interior holds no match, and places one match on each of the match-free edges bounding the subtable.
    The move is legal if at least one of the bounding edges had no match yet, and either k = 1 or k is
    divisible by 4. The two players alternate, and the player to move must play one of the largest legal
    moves of size 0 &lt; k &lt; n. The game ends when a player cannot move legally: that player loses.
  </>
};

export const MatchesOnEdges = strategyGameFactory({
  presentation: {
    rule,
    roleLabels: [
      { hu: 'Kezdő vagyok', en: 'I go first' },
      { hu: 'Második vagyok', en: 'I go second' }
    ],
    getPlayerStepDescription: ({ board }) => {
      const k = currentWindowSize(board);
      if (k === null) return { hu: 'Vége a játéknak.', en: 'The game is over.' };
      return {
        hu: `A legnagyobb szabályos lépés mérete ${k}. Jelölj ki egy ${k} hosszú résztáblát a bal `
          + 'szélső mezőjére kattintva, majd rakd rá a gyufákat.',
        en: `The largest legal move has size ${k}. Mark a length-${k} subtable by clicking its `
          + 'leftmost cell, then place the matches.'
      };
    }
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      generateStartBoard,
      label: { hu: 'Teszt', en: 'Test' }
    },
    // smart bot: verified as optimal (see bot-strategy.spec.ts)
    {
      botStrategy: smartBotStrategy,
      generateStartBoard,
      label: { hu: 'Teljes', en: 'Full' },
      isDefault: true
    }
  ]
});
