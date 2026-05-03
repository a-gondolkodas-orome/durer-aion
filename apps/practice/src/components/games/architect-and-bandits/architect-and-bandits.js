import React from 'react';
import { cloneDeep } from 'lodash';
import { strategyGameFactory } from '../../game-factory/strategy-game';
import { BoardClient } from './board-client';
import { aiBotStrategy } from './bot-strategy';

// Vertices A(0)..H(7) clockwise, each edge 10 km, max 40 km/day

const generateStartBoard = () => {
  const towers = Array(8).fill(false);
  /*
  Workaround to have a tower at the start of day 1, as startOfTurnMove or
  similar is not supported by framework.
  */
  towers[0] = true;
  return {
    architectPosition: 0,
    towers,
    day: 1,
    kmUsedToday: 0
  };
};

const moves = {
  moveArchitect: (board, _ctx, targetVertex) => {
    const nextBoard = cloneDeep(board);
    nextBoard.architectPosition = targetVertex;
    nextBoard.towers[targetVertex] = true;
    nextBoard.kmUsedToday += 10;
    return { nextBoard };
  },

  endDay: (board, { events }) => {
    const nextBoard = cloneDeep(board);
    nextBoard.kmUsedToday = 0;
    if (board.day === 4) {
      const allTowers = nextBoard.towers.every(t => t);
      events.endGame({ winnerIndex: allTowers ? 0 : 1 });
      return { nextBoard };
    }
    events.endTurn();
    return { nextBoard };
  },
  destroyTower: (board, _ctx, vertex) => {
    const nextBoard = cloneDeep(board);
    nextBoard.towers[vertex] = false;
    return { nextBoard, autoEndOfTurn: true };
  },
  startNextDay: (board, { events }) => {
    const nextBoard = cloneDeep(board);
    nextBoard.day += 1;
    nextBoard.kmUsedToday = 0;
    nextBoard.towers[nextBoard.architectPosition] = true;
    events.endTurn();
    return { nextBoard };
  }
};

const rule = {
  hu: <>
    Óxisz városa egy szabályos nyolcszög alakú fallal van körülvéve, melynek szomszédos csúcsai 10 km-re
    vannak egymástól. A város építésze szeretne négy nap alatt mind a nyolc csúcsba egy-egy őrtornyot
    építeni, ám ezt a banditák szeretnék megakadályozni. Az építész úgy építi a tornyokat, hogy ha
    napközben az útja során (akár az elején vagy a végén) érint egy csúcsot, ahol még nincs torony,
    akkor elhelyez oda egyet.
    Az építész az A-val jelölt csúcsból indul, csak a várfalakon mozoghat, minden nap legfeljebb 40 km-t
    tud megtenni és az éjszakát a várfal egyik csúcsánál kell töltenie. Ezután éjszaka a banditák
    kiválaszthatnak egy csúcsot, és az ott lévő tornyot lerombolhatják. Az építész akkor nyer, ha a
    negyedik napon napnyugtakor mind a nyolc csúcsban áll egy-egy torony, ellenkező esetben a banditák
    győznek.
  </>,
  en: <>
    The city of Óxisz is surrounded by a regular octagon-shaped wall, with adjacent vertices 10 km
    apart. The city's architect wants to build a watchtower at each of the eight vertices in four days,
    but the bandits want to prevent this. The architect builds a tower whenever their daily journey
    touches a vertex (including at the very start or end of the day) where no tower stands yet.
    The architect starts from vertex A, can only move along the walls, can travel at most 40 km per
    day, and must spend the night at a vertex. Each night the bandits may choose one vertex and destroy
    the tower there. The architect wins if all eight vertices have a watchtower at sunset on day four;
    otherwise the bandits win.
  </>
};


export const ArchitectAndBandits = strategyGameFactory({
  presentation: {
    rule,
    roleLabels: [
      { hu: 'Építész', en: 'Architect' },
      { hu: 'Banditák', en: 'Bandits' }
    ],
    getPlayerStepDescription: ({ board, ctx }) => {
      if (ctx.currentPlayer === 0) {
        const movesLeft = (40 - board.kmUsedToday) / 10;
        if (movesLeft === 0) {
          return {
            hu: `${board.day}. nap: Fejezd be a napot!`,
            en: `Day ${board.day}: End the day!`
          };
        }
        return {
          hu: `${board.day}. nap: Lépj egy szomszédos csúcsra (${movesLeft} lépés maradt), vagy fejezd be a napot.`,
          en: `Day ${board.day}: Move to an adjacent vertex (${movesLeft} moves left), or end the day.`
        };
      }
      return {
        hu: `${board.day}. éjszaka: Kattints egy toronyra, hogy lerombold.`,
        en: `Night ${board.day}: Click a tower to destroy it.`
      };
    }
  },
  BoardClient,
  gameplay: { moves, endOfTurnMove: 'startNextDay' },
  variants: [{ botStrategy: aiBotStrategy, generateStartBoard }]
});
