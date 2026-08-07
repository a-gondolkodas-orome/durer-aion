import { strategyGameFactory } from 'strategy-game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { generateStartBoard } from '../gameplay';
import { makeBoardClient } from '../board-client';
import { moves, CARD_COUNT } from './gameplay';

const BoardClient = makeBoardClient(CARD_COUNT);

const rule = {
  hu: <>
    <b>Nyomozó és Tolvaj</b> az alábbi játékot játssza. Kilenc kártya van az asztalon lévő készletben,
    az 1, 2, ..., {CARD_COUNT} számokkal jelölve. Nyomozó és Tolvaj felváltva vesz a kezébe egyet-egyet
    az asztalon lévő kártyák közül úgy, hogy az első kártyát Nyomozó veszi el.
    Tolvaj akkor nyer, ha a játék végéig összegyűjt három olyan kártyát, melyek közül az egyiken
    lévő szám a másik kettőnek az átlaga. Nyomozó pedig akkor nyer, ha Tolvaj nem gyűjt össze
    három ilyen kártyát.
  </>,
  en: <>
    <b>Sheriff and Thief</b> play the following game. Nine cards numbered 1, 2, …, {CARD_COUNT} are on
    the table. Sheriff and Thief alternate picking up cards, with the Sheriff going first.
    The Thief wins if they collect three cards where one number is the average of the other two.
    The Sheriff wins if the Thief fails to collect such a triple.
  </>
};

export const ThiefSheriffMean9 = strategyGameFactory({
  presentation: {
    rule,
    roleLabels: [
      { hu: 'Nyomozó', en: 'Sheriff' },
      { hu: 'Tolvaj', en: 'Thief' }
    ],
    getPlayerStepDescription: () => ({ hu: 'Válassz egy kártyát.', en: 'Pick a card.' })
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt', en: 'Test' } },
    { botStrategy: smartBotStrategy, generateStartBoard, label: { hu: 'Teljes', en: 'Full' }, isDefault: true }
  ]
});
