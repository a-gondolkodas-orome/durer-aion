import {
  strategyGameFactory, type Ctx, type MoveOutcome, type BotStrategy, type BoardClientProps, GameBoard
} from '../../strategy-game-factory';
import { random } from 'lodash';
import { useTranslation } from '../../../language';

type Board = number[]

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();
  return(
    <GameBoard>
      <p className='text-4xl font-bold text-center mb-2'>
        <code>({board[0]},{board[1]})</code>
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          className="primary-button w-auto grow"
          disabled={!ctx.isClientMoveAllowed}
          onClick={() => moves.add1(board)}
        >
          {t({ hu: 'Növelek', en: 'Increase' })} {ctx.isClientMoveAllowed && <>
            (→<code>({board[0]},{board[1] + 1})</code>)
          </>}
        </button>
        <button
          className="primary-button w-auto grow"
          disabled={!ctx.isClientMoveAllowed}
          onClick={() => moves.subtract(board)}
        >
          {t({ hu: 'Kivonok', en: 'Subtract' })} {ctx.isClientMoveAllowed && <>
            (→<code>({board[0] - board[1]},{board[1]})</code>)
          </>}
        </button>
      </div>
    </GameBoard>
  );
};

export const moves = {
  add1: {
    apply: (board: Board): MoveOutcome<Board> =>
      ({ nextBoard: [board[0], board[1] + 1], isTurnEnd: true })
  },
  subtract: {
    apply: (board: Board, { ctx }: { ctx: Ctx }): MoveOutcome<Board> => {
      const nextBoard = [board[0] - board[1], board[1]];
      if (board[0] - board[1] <= 0) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

type Bot = BotStrategy<Board, keyof typeof moves>

const randomBotStrategy: Bot = () =>
  random(0, 1) === 0 ? { move: 'add1' } : { move: 'subtract' };

const smartBotStrategy: Bot = ({ board }) => {
  const [a, b] = board;
  if (a <= b) {
    return { move: 'subtract' };
  }
  if (a <= 2 * b) {
    return { move: 'add1' };
  }

  if (a % 2 === 0 && b % 2 === 0) {
    return { move: 'add1' };
  }
  if (a % 2 === 1 && b % 2 === 1) {
    return { move: 'subtract' };
  }
  if (a % 2 === 1 && b % 2 === 0) {
    return { move: 'subtract' };
  }

  return { move: 'add1' };
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
    Two players take turns. In each turn, if the pair
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
      label: { hu: 'Teszt', en: 'Test' }
    },
    // smart bot: verified as optimal
    {
      botStrategy: smartBotStrategy,
      generateStartBoard,
      label: { hu: 'Teljes', en: 'Full' },
      isDefault: true
    }
  ]
});
