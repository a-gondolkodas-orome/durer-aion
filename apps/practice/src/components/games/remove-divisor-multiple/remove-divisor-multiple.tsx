import {
  strategyGameFactory, type Ctx, type MoveOutcome, type BoardClientProps, type BotStrategy, GameBoard
} from '../../strategy-game-factory';
import { range, cloneDeep, sample, random } from 'lodash';
import { strategyDict } from './bot-strategy';
import { useTranslation } from '../../../language';

type Board = { numbersOnTable: boolean[], previousMove: number | null }

// The number must still be on the table, and — from the second move on — be a
// divisor or a multiple of the number the other player just removed. The
// on-the-table check used to be skipped for the opening move, where every
// number is still there anyway; hoisting it above the previousMove branch
// changes nothing for a real opening move but keeps a bogus argument out.
export const isAllowed = (board: Board, n) => {
  if (!Number.isInteger(n) || n < 1 || n > board.numbersOnTable.length) return false;
  if (board.numbersOnTable[n - 1] === false) return false;
  if (board.previousMove === null) {
    return true;
  }
  if (board.previousMove > n && board.previousMove % n === 0) {
    return true;
  } else if (board.previousMove < n && n % board.previousMove === 0) {
    return true;
  }
  return false;
}

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
        {t({ hu: 'Az előző lépés', en: 'Previous move' })}: {board.previousMove === null ? "-" : board.previousMove}
      </p>
    </GameBoard>
  )
};

export const moves = {
  removeNumber: {
    validate: (board: Board, _, n) => isAllowed(board, n),
    apply: (board: Board, { ctx }: { ctx: Ctx }, n): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard.numbersOnTable[n - 1] = false;
      nextBoard.previousMove = n;
      if (isGameEnd(nextBoard)) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

const isGameEnd = (board: Board) => {
  const possibleMoves = range(1, board.numbersOnTable.length + 1)
    .filter(n => isAllowed(board, n));
  return possibleMoves.length === 0;
}

const randomBotStrategy: BotStrategy<Board> = ({ board }) => {
  const possibleMoves = range(1, board.numbersOnTable.length + 1)
    .filter(n => isAllowed(board, n));
  return { move: 'removeNumber', args: [sample(possibleMoves)] };
};

const smartBotStrategy: BotStrategy<Board> = ({ board }) => {
  const numCount = board.numbersOnTable.length;
  const stateId = generateStateID(board);
  const optimalMoves = strategyDict[numCount]
    ? strategyDict[numCount][stateId]
    : [];
  if (optimalMoves.length) {
    return { move: 'removeNumber', args: [sample(optimalMoves)] };
  } else {
    const possibleMoves = range(1, numCount + 1)
      .filter(n => isAllowed(board, n));
    return { move: 'removeNumber', args: [sample(possibleMoves)] };
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
