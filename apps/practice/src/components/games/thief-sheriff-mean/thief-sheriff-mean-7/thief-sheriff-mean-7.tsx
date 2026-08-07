import { strategyGameFactory } from 'strategy-game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { generateStartBoard } from '../gameplay';
import { makeBoardClient } from '../board-client';
import { moves, CARD_COUNT } from './gameplay';

const BoardClient = makeBoardClient(CARD_COUNT);

const rule = {
  hu: <>
    <b>Nyomozó és Tolvaj</b> az alábbi játékot játssza. Hét kártya van az asztalon lévő készletben,
    az 1, 2, ..., {CARD_COUNT} számokkal jelölve. A játék {CARD_COUNT} lépésből áll, minden lépésben az egyik
    játékos kezébe vesz egyet az asztalon lévő kártyák
    közül. Az alábbi sorrend szerint lépnek a játékosok:
    <br />
    <b>
    1. Nyomozó, 2. Tolvaj, 3. Nyomozó, 4. Tolvaj, 5. Nyomozó, 6. Tolvaj, 7. Tolvaj.
    </b>
    <br />
    Tolvaj akkor nyer, ha a játék végéig összegyűjt három olyan kártyát, melyek közül az egyiken lévő szám a másik
    kettőnek az átlaga. Nyomozó pedig akkor nyer, ha Tolvaj nem gyűjt össze három ilyen kártyát.
  </>,
  en: <>
    <b>Sheriff and Thief</b> play the following game. Seven cards numbered 1, 2, …, {CARD_COUNT} are on
    the table. The game lasts {CARD_COUNT} turns; on each turn one player picks up a card.
    The turn order is:
    <br />
    <b>
    1. Sheriff, 2. Thief, 3. Sheriff, 4. Thief, 5. Sheriff, 6. Thief, 7. Thief.
    </b>
    <br />
    The Thief wins if they collect three cards where one number is the average of the other two.
    The Sheriff wins if the Thief fails to collect such a triple.
  </>
};

export const ThiefSheriffMean7 = strategyGameFactory({
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
