import {
  strategyGameFactory,
  type Ctx, type MoveOutcome, type StrategyArgs, type BoardClientProps,
  GameBoard
} from '../../strategy-game-factory';
import { range, random, sample } from 'lodash';
import { ChessBishopSvg } from '../chess-bishops/chess-bishop-svg';

type Board = { left: number, right: number }

// A piece advances one or two squares; landing exactly on the other piece is
// the one thing forbidden. Both players step by the same rule, so whose turn it
// is does not enter into legality — only which piece the step then moves.
export const isValidStep = (board: Board, step) =>
  (step === 1 || step === 2) && step !== board.right - board.left;

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const potentialStep = i => {
    return ctx.currentPlayer === 0 ? i - board.left : board.right - i;
  }

  const cellBackground = (i) => {
    if (i === board.left) return 'bg-green-400';
    if (i === board.right) return 'bg-purple-400';
    if (moves.step.isAllowed(board, potentialStep(i))) {
      return ctx.currentPlayer === 0
        ? 'bg-green-200 dark:bg-green-700 enabled:hocus:bg-green-400 dark:enabled:hocus:bg-green-600'
        : 'bg-purple-200 dark:bg-purple-700 enabled:hocus:bg-purple-400 dark:enabled:hocus:bg-purple-600';
    }
    return 'bg-slate-200 dark:bg-slate-700';
  };

  return (
  <GameBoard>
    <ChessBishopSvg/>
    <div className="grid grid-cols-12 gap-1">
        {range(1,13).map(i =>
          <button
            key={i}
            className={`
              w-full aspect-square text-xl font-bold rounded-sm drop-shadow-sm p-[10%]
              ${cellBackground(i)}
            `}
            disabled={!moves.step.isAllowed(board, potentialStep(i))}
            onClick={() => moves.step(board, potentialStep(i))}
          >{ i === board.left || i === board.right
            ? <svg className="w-full aspect-square">
                <use href="#game-chess-bishop" />
              </svg>
            : i }
          </button>
        )}
    </div>
  </GameBoard>
  );
};

const randomBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  const validSteps = [1, 2].filter(step => isValidStep(board, step));
  moves.step(board, sample(validSteps));
};

const optimalBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  const step = getOptimalBotStep(board);
  moves.step(board, step);
};

const getOptimalBotStep = ({ left, right }) => {
  const dst = right-left;
  if(dst === 1) return 2;
  if(dst === 2) return 1;
  if(dst % 3 === 2) return random(1,2);
  return (dst+1) % 3;
};

export const moves = {
  step: {
    validate: (board: Board, _, step) => isValidStep(board, step),
    apply: (board: Board, { ctx }: { ctx: Ctx }, step): MoveOutcome<Board> => {
      const nextBoard = ctx.currentPlayer === 0
        ? { left: board.left + step, right: board.right }
        : { left: board.left, right: board.right - step };
      if (nextBoard.right < nextBoard.left) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

const rule = {
  hu: <>
    Van 12 mező egymás mellett. A két szélsőbe lerakunk egy-egy bábut. Ezután a játékosok
    felváltva lépnek egyet vagy kettőt a saját bábujukkal a másik irányába. A másik bábujára rálépni nem
    szabad. Az nyer, aki átugorja a másik játékos bábuját.
  </>,
  en: <>
    A 1 × 12 board is given with one piece placed on each end.
    Players take turns moving their piece toward the other, advancing one or two squares at a time.
    A player may not move to a square already occupied by the other player's piece.
    The player who jumps over the other player's piece wins.
  </>
};

export const TwelveSquares = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription: ({ ctx: { currentPlayer } }) => currentPlayer === 0
      ? {
        hu: 'Kattints a mezőre ahova lépni szeretnél a bal oldali bábuval.',
        en: 'Click the square you want to move to with the left piece.'
      }
      : {
        hu: 'Kattints a mezőre ahova lépni szeretnél a jobb oldali bábuval.',
        en: 'Click the square you want to move to with the right piece.'
      }
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt', en: 'Test' } },
    {
      // smart bot: verified as optimal
      botStrategy: optimalBotStrategy,
      generateStartBoard: () => ({ left: 1, right: 12 }),
      label: { hu: 'Teljes', en: 'Full' },
      isDefault: true
    }
  ]
});
