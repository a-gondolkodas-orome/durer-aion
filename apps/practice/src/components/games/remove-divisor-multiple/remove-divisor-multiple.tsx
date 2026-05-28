import {
  strategyGameFactory, type Events, type BoardClientProps, type StrategyArgs, GameBoard
} from '../../game-factory';
import { range, cloneDeep, sample, random } from 'lodash';
import { strategyDict } from './bot-strategy';
import { useTranslation } from '../../language';

type Board = { numbersOnTable: boolean[], previousMove: number | null }

const isAllowed = (board: Board, n) => {
  if (board.previousMove === null) {
    return true;
  }
  if (board.numbersOnTable[n - 1] === false) return false;
  if (board.previousMove > n && board.previousMove % n === 0) {
    return true;
  } else if (board.previousMove < n && n % board.previousMove === 0) {
    return true;
  }
  return false;
}

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();
  const isMoveAllowed = n => isAllowed(board, n);

  const removeNumber = n => {
    if (!ctx.isClientMoveAllowed) return;
    if (!isMoveAllowed(n)) return;
    moves.removeNumber(board, n);
  }

  return (
    <GameBoard>
      <p className = "text-2xl">
        {t({
          hu: `A mostani játékban n=${board.numbersOnTable.length}`,
          en: `In this game n=${board.numbersOnTable.length}`
        })}
      </p>
      <p className = "text-2xl">
        {t({ hu: 'Az előző lépés', en: 'Previous move' })}: {board.previousMove === null ? "-" : board.previousMove}
      </p>
      <div>
        {range(1, board.numbersOnTable.length + 1).map(num =>
          <button
            key={num}
            disabled={!isMoveAllowed(num) || !ctx.isClientMoveAllowed}
            onClick={() => removeNumber(num)}
            className={`
              m-1 min-h-28 w-18
              border-4 shadow-md rounded-xl text-4xl
              text-center font-bold
              ${board.numbersOnTable[num - 1] ? '' : 'opacity-50 border-gray-600 text-gray-600'}
              ${board.numbersOnTable[num - 1] ? (isMoveAllowed(num) ? 'border-green-600' : 'border-red-600') : ''}
              enabled:hocus:bg-green-600
            `}
          >
            {num}
          </button>
        )}
      </div>
    </GameBoard>
  )
};

const moves = {
  removeNumber: (board: Board, { events }: { events: Events }, n) => {
    const nextBoard = cloneDeep(board);
    nextBoard.numbersOnTable[n - 1] = false;
    nextBoard.previousMove = n;
    events.endTurn();
    if (isGameEnd(nextBoard)) {
      events.endGame();
    }
    return { nextBoard };
  }
};

const isGameEnd = (board: Board) => {
  const possibleMoves = range(1, board.numbersOnTable.length + 1)
    .filter(n => isAllowed(board, n));
  return possibleMoves.length === 0;
}

const randomBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  const possibleMoves = range(1, board.numbersOnTable.length + 1)
    .filter(n => isAllowed(board, n));
  moves.removeNumber(board, sample(possibleMoves));
};

const smartBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  const numCount = board.numbersOnTable.length;
  const stateId = generateStateID(board);
  const optimalMoves = strategyDict[numCount]
    ? strategyDict[numCount][stateId]
    : [];
  if (optimalMoves.length) {
    moves.removeNumber(board, sample(optimalMoves));
  } else {
    const possibleMoves = range(1, numCount + 1)
      .filter(n => isAllowed(board, n));
    moves.removeNumber(board, sample(possibleMoves));
  }
};

const generateStateID = (board: Board) => {
  let id = 0;
  for (let i = 0; i < board.numbersOnTable.length; i++) {
    if (board.numbersOnTable[i]){
      id += 2**(i)
    }
  }
  return (board.previousMove === null ? '-1' : board.previousMove) + "_" +id;
}

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

const generateStartBoard = (): Board => {
  const numCount = random(0, 2) === 0
    ? sample([6, 10])!
    : sample([7, 8, 9, 11, 12, 13, 14, 15])!;
  return ({
    numbersOnTable: Array(numCount).fill(true),
    previousMove: null
  })
}

const generateTestStartBoard = (): Board => {
  const numCount = random(0, 2) === 0
    ? sample([6])!
    : sample([7, 8, 9])!;
  return ({
    numbersOnTable: Array(numCount).fill(true),
    previousMove: null
  })
}

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
      label: { hu: 'Teszt 🤖', en: 'Test 🤖' }
    },
    {
      botStrategy: smartBotStrategy,
      generateStartBoard,
      label: { hu: 'Okos 🤖', en: 'Smart 🤖' },
      isDefault: true
    }
  ]
});
