import { strategyGameFactory, type BoardClientProps, GameBoard } from '../../strategy-game-factory';
import { range } from 'lodash';
import { useTranslation } from '../../../language';
import { generateStartBoard, generateTestStartBoard, isAllowed, moves, type Board } from './gameplay';
import { randomBotStrategy, smartBotStrategy } from './bot-strategy';

const BoardClient = ({ board, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();
  // Two different questions: `isLegal` marks the numbers that could be removed
  // from this position — shown in blue whoever is on turn — while `isAllowed`
  // additionally requires that it is this client's move, and gates the buttons.
  const isLegal = n => isAllowed(board, n);

  const removeNumber = n => moves.removeNumber(board, n);

  return (
    <GameBoard>
      <div>
        {range(1, board.numbersOnTable.length + 1).map(num =>
          <button
            key={num}
            disabled={!moves.removeNumber.isAllowed(board, num)}
            onClick={() => removeNumber(num)}
            className={`
              m-1 min-h-28 w-18 border-4 rounded-lg shadow-md text-4xl font-bold
              ${board.numbersOnTable[num - 1] ? '' : 'opacity-50 border-dashed'}
              ${board.numbersOnTable[num - 1] ? (isLegal(num) ? 'border-blue-600' : 'border-red-600') : ''}
              enabled:hocus:opacity-50 enabled:hocus:border-dashed
              `}
          >
            {num}
          </button>
        )}
      </div>
      <p className="text-2xl mt-2">
        {t({ hu: 'Az előző lépés', en: 'Previous move' })}: {board.previousMove === null ? '-' : board.previousMove}
      </p>
    </GameBoard>
  )
};

const rule = {
  hu: <>
    Egy táblára az <i>1</i>, <i>2</i>, <i>...</i>, <i>n</i> számok (<i>n &#8804; 15</i>)
    vannak felírva. Két játékos játszik, felváltva lépnek. A kezdőjátékos az első
    lépésében kiválaszt egy tetszőleges számot a tábláról és letörli azt. Ezután
    minden lépésben egy olyan számot kell letörölni, ami az előző (másik játékos
    által letörölt) számnak osztója vagy többszöröse. Az veszít, aki nem tud lépni.
  </>,
  en: <>
    The numbers <i>1</i>, <i>2</i>, <i>...</i>, <i>n</i> (<i>n &#8804; 15</i>) are written on a
    board. Two players take turns. On the first move the first player removes any number from the
    board. From then on, each move must remove a number that is a divisor or multiple of the
    previously removed number. The player who cannot move loses.
  </>
};

const getPlayerStepDescription = () => ({
  hu: 'Válassz egyet a letörölhető számok közül.',
  en: 'Choose one of the numbers that can be removed.'
});

export const RemoveDivisorMultiple = strategyGameFactory({
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
