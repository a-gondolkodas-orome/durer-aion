import {
  strategyGameFactory, type Events, type StrategyArgs, type BoardClientProps, GameBoard
} from '../../game-factory';
import { random } from 'lodash';
import { useTranslation } from '../../language';

type Board = number[]

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();
  return(
    <GameBoard>
      <p className='text-4xl font-bold text-center mb-2'>
        <code>({board[0]},{board[1]})</code>
      </p>
      <div className="flex flex-wrap">
        <span className="grow px-2">
          <button
            className='primary-button'
            disabled={!ctx.isClientMoveAllowed}
            onClick={() => moves.add1(board)}
          >
            {t({ hu: 'Növelek', en: 'Increase' })} {ctx.isClientMoveAllowed && <>
              (→<code>({board[0]},{board[1] + 1})</code>)
            </>}
          </button>
        </span>
        <span className='grow px-2'>
          <button
            className="primary-button"
            disabled={!ctx.isClientMoveAllowed}
            onClick={() => moves.subtract(board)}
          >
            {t({ hu: 'Kivonok', en: 'Subtract' })} {ctx.isClientMoveAllowed && <>
              (→<code>({board[0] - board[1]},{board[1]})</code>)
            </>}
          </button>
        </span>
      </div>
    </GameBoard>
  );
};

const moves = {
  add1: (board: Board, { events }: { events: Events }) => {
    events.endTurn();
    return { nextBoard: [board[0], board[1] + 1] }
  },
  subtract: (board: Board, { events }: { events: Events }) => {
    events.endTurn();
    if (board[0] - board[1] <= 0) {
      events.endGame();
    }
    return { nextBoard: [board[0] - board[1], board[1]] };
  }
};

const randomBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  if (random(0, 1) === 0) {
    moves.add1(board);
  } else {
    moves.subtract(board);
  }
};

const smartBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  const [a, b] = board;
  if (a <= b) {
    moves.subtract(board);
    return;
  }
  if (a <= 2 * b) {
    moves.add1(board);
    return;
  }

  if (a % 2 === 0 && b % 2 === 0) {
    moves.add1(board);
    return;
  }
  if (a % 2 === 1 && b % 2 === 1) {
    moves.subtract(board);
    return;
  }
  if (a % 2 === 1 && b % 2 === 0) {
    moves.subtract(board);
    return;
  }

  moves.add1(board);
};

const rule = {
  hu: <>
    Adott egy pozitív egészekből álló <code>(n,&nbsp;k)</code> rendezett számpár.
    Két játékos felváltva lép, az <code>(a,&nbsp;b)</code> számpár
    helyére egy lépésben kerülhet vagy az <code className="whitespace-nowrap">(a, b + 1)</code>,
    vagy az <code className="whitespace-nowrap">(a − b, b)</code> számpár.
    Az nyer, aki először ír fel olyan számpárt, amelyben nem mindkét szám pozitív.
  </>,
  en: <>
    Initially, an ordered pair of positive integers <code>(n,&nbsp;k)</code> is written on a sheet of paper.
    Two players are playing a game, taking turns alternately. In each turn, if the pair
    <code>(a,&nbsp;b)</code> is on the sheet and is not crossed out, then the player
    must cross out <code>(a,&nbsp;b)</code> and instead write
    <code className="whitespace-nowrap">(a, b + 1)</code> or
    <code className="whitespace-nowrap">(a − b, b)</code> on the sheet.
    The winner is the first player to write a pair in which at least one of the numbers is not positive.
  </>
};

const generateTestStartBoard = () => {
  const b = random(2, 5);
  const a = b + random(1, b);
  return [a, b];
};

const generateStartBoard = () => {
  if (random(0, 2) === 0) {
    const b = random(8, 15);
    const a = b + random(1, b);
    return [a, b];
  }
  if (random(0, 1) === 0) {
    const r = random(0, 2);
    if (r === 0) {
      const b = random(5, 9) * 2 + 1;
      const a = b * 2 + random(0, 5) * 2;
      return [a, b];
    } else if (r === 1) {
      const b = random(5, 9) * 2 + 1;
      const a = b * 2 + random(0, 5) * 2 + 1;
      return [a, b];
    } else if (r === 2) {
      const b = random(5, 9) * 2;
      const a = b * 2 + random(0, 5) * 2;
      return [a, b];
    }
  } else {
    const b = random(5, 9) * 2;
    const a = b * (2 + random(0, 3)) + random(0, Math.floor((b - 1)/2)) * 2 + 1;
    return [a, b];
  }

  return [random(15, 25), random(10, 15)];
}

export const PairsOfNumbers = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription: () => ({
      hu: 'Növeld a második számot eggyel vagy vond ki az elsőből.',
      en: 'Increase the second number by 1 or subtract it from the first.'
    })
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      generateStartBoard: generateTestStartBoard,
      label: { hu: 'Teszt 🤖', en: 'Test 🤖' }
    },
    // smart bot: verified as optimal
    { botStrategy: smartBotStrategy, generateStartBoard, label: { hu: 'Okos 🤖', en: 'Smart 🤖' }, isDefault: true }
  ]
});
