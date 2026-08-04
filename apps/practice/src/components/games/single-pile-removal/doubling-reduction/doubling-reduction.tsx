import { strategyGameFactory } from '../../../strategy-game-factory';
import { BoardClient, getPlayerStepDescription } from '../pebble-pile';
import {  } from '../gameplay';
import { generateStartBoard, generateTestStartBoard, moves } from './gameplay';
import { randomBotStrategy, smartBotStrategy } from './bot-strategy';

const rule = {
  hu: <>
    Két játékos felváltva vesz el néhány kavicsot egy kupacból. Minden lépésben legalább egy
    kavicsot el kell venni. Az veszít, aki nem tud szabályosan lépni. A kezdő játékos az első
    lépésben legfeljebb eggyel kevesebb kavicsot vehet el, mint amennyi a kupacban van; ezután
    mindenki szigorúan kevesebbet vehet el, mint kétszer annyit, mint amennyit a másik játékos az
    előző lépésben elvett.
  </>,
  en: <>
    Two players alternately take some pebbles from a pile. At least one pebble must be taken each
    turn, and whoever cannot move loses. On the opening move the starting player may take at most one
    fewer than the whole pile; after that, each player may take strictly fewer than twice as many as
    the other player took on the previous move.
  </>
};

export const DoublingReduction = strategyGameFactory({
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
