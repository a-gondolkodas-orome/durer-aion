import { strategyGameFactory } from '../../../strategy-game-factory';
import { BoardClient, getPlayerStepDescription } from '../pebble-pile';
import {  } from '../gameplay';
import { generateStartBoard, generateTestStartBoard, moves } from './gameplay';
import { randomBotStrategy, smartBotStrategy } from './bot-strategy';

const rule = {
  hu: <>
    Ketten felváltva vesznek el egy kupac kavicsból legalább egy kavicsot. A kezdő első
    lépésben legfeljebb a kezdeti kavicsok felét veheti el. Ezután mindkét játékos maximum
    annyit vehet el, mint amennyit a másik vett el legutóbb. Az nyer, aki az utolsó
    kavicso(ka)t veszi el.
  </>,
  en: <>
    Two players alternately take at least one pebble from a pile. On the opening move the starting
    player may take at most half of the initial pebbles. After that, each player may take at most as
    many as the other took last time. Whoever takes the last pebble(s) wins.
  </>
};

export const WaningStones = strategyGameFactory({
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
      // smart bot: verified as optimal
      botStrategy: smartBotStrategy,
      generateStartBoard,
      label: { hu: 'Teljes', en: 'Full' },
      isDefault: true
    }
  ]
});
