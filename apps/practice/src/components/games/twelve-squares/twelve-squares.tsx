import {
  strategyGameFactory,
  type Ctx, type Events, type StrategyArgs, type BoardClientProps,
  GameBoard
} from '../../game-factory';
import { range, random, sample } from 'lodash';
import { ChessBishopSvg } from '../chess-bishops/chess-bishop-svg';

type Board = { left: number, right: number }

const isValidStep = (board: Board, step) =>
  (step === 1 || step === 2) && step !== board.right - board.left;

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const isMoveAllowed = (step) => {
    if (!ctx.isClientMoveAllowed) return false;
    return isValidStep(board, step);
  };

  const makeStep = (step) => {
    if (!isMoveAllowed(step)) return;
    moves.step(board, step);
  };

  const potentialStep = i => {
    return ctx.currentPlayer === 0 ? i - board.left : board.right - i;
  }

  const cellBackground = (i) => {
    if (i === board.left) return 'bg-green-400';
    if (i === board.right) return 'bg-purple-400';
    if (isMoveAllowed(potentialStep(i))) {
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
            disabled={!isMoveAllowed(potentialStep(i))}
            onClick={() => makeStep(potentialStep(i))}
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

const moves = {
  step: (board: Board, { ctx, events }: { ctx: Ctx, events: Events }, step) => {
    const nextBoard = ctx.currentPlayer === 0
      ? { left: board.left + step, right: board.right }
      : { left: board.left, right: board.right - step };
    events.endTurn();
    if (nextBoard.right < nextBoard.left) {
      events.endGame();
    }
    return { nextBoard };
  }
};

const rule = {
  hu: <>
    Van 12 mező egymás mellett. A két szélsőbe lerakunk egy-egy bábut. Ezután a játékosok
    felváltva lépnek egyet vagy kettőt a saját bábujukkal a másik irányába. A másik bábujára rálépni nem
    szabad. Az nyer, aki átugorja az ellenfél bábuját.
  </>,
  en: <>
    A 1 × 12 board is given with one piece placed on each end.
    Players take turns moving their piece toward the other, advancing one or two squares at a time.
    A player may not move to a square already occupied by the opponent's piece.
    The player who jumps over their opponent's piece wins.
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
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt 🤖', en: 'Test 🤖' } },
    {
      // smart bot: verified as optimal
      botStrategy: optimalBotStrategy,
      generateStartBoard: () => ({ left: 1, right: 12 }),
      label: { hu: 'Okos 🤖', en: 'Smart 🤖' },
      isDefault: true
    }
  ]
});
