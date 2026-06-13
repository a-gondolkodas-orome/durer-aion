import { strategyGameFactory, type BoardClientProps, GameBoard } from '../../../game-factory';
import { range } from 'lodash';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import {
  Sheriff,
  Thief,
  getUntakenCards,
  generateStartBoard,
  type Board
} from "../helpers";
import { moves, CARD_COUNT } from './moves';

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const isAllowedMove = index => {
    if (!ctx.isClientMoveAllowed) return false;
    return getUntakenCards(board, CARD_COUNT).includes(index);
  }

  const clickCard = (index) => {
    if (!isAllowedMove(index)) return;
    moves.takeCard(board, [index]);
  }

  const getCardColor = num => {
    if (board.cards[Thief].includes(num)) return 'bg-red-800';
    if (board.cards[Sheriff].includes(num)) return 'bg-blue-800 text-white';
    return 'bg-slate-50';
  }

  return(
    <GameBoard>
      <div>
        {range(1, CARD_COUNT + 1).map(num =>
        <button
          key={num}
          disabled={!isAllowedMove(num)}
          onClick={() => clickCard(num)}
          className={`
            m-1 min-h-28 w-18 border-2 rounded-lg shadow-md border-slate-900 text-4xl font-bold
            ${ctx.currentPlayer === Thief
              ? "enabled:hocus:bg-red-800/75"
              : "enabled:hocus:bg-blue-800/75 enabled:hocus:text-white"
            }
            ${getCardColor(num)}
          `}
        >
          {num}
        </button>)}
      </div>
    </GameBoard>
    );
};


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
      { hu: 'Nyomozó', en: "Sheriff" },
      { hu: 'Tolvaj', en: "Thief" }
    ],
    getPlayerStepDescription: () => ({ hu: 'Válassz egy kártyát.', en: 'Pick a card.' })
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt 🤖', en: 'Test 🤖' } },
    // smart bot: verified as optimal
    { botStrategy: smartBotStrategy, generateStartBoard, label: { hu: 'Okos 🤖', en: 'Smart 🤖' }, isDefault: true }
  ]
});
