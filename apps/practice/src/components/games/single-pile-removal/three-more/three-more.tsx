import { strategyGameFactory } from '../../../strategy-game-factory';
import { BoardClient, getPlayerStepDescription } from '../pebble-pile';
import {  } from '../gameplay';
import { generateStartBoard, moves } from './gameplay';
import { smartBotStrategy } from './bot-strategy';

const rule = {
  hu: <>
    Ketten felváltva vesznek el egy kupac kavicsból legalább egy kavicsot. A kezdő játékos
    első lépésben legfeljebb 4 kavicsot vehet el. Ezután mindkét játékos maximum hárommal több
    kavicsot vehet el, mint amennyit a másik vett el legutóbb. Az nyer, aki az utolsó
    kavicso(ka)t veszi el.
  </>,
  en: <>
    Two players alternately take at least one pebble from a pile. On the opening move the starting
    player may take at most 4 pebbles. After that, each player may take at most three more pebbles
    than the other player took last time. Whoever takes the last pebble(s) wins.
  </>
};

export const ThreeMore = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  variants: [{ botStrategy: smartBotStrategy, generateStartBoard }]
});
