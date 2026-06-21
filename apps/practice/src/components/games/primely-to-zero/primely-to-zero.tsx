import {
  strategyGameFactory,
  type Ctx, type Events, type StrategyArgs, type BoardClientProps,
  GameBoard
} from '../../game-factory';
import { range, sample } from 'lodash';

type Board = number

const minStart = 30;
const maxStart = 80;

const validSteps = new Set([1, 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79]);

const isValidStep = (d: number): boolean => validSteps.has(d);

const isMoveValid = (board: Board, target: number): boolean => {
  if (target < 0 || target >= board) return false;
  return isValidStep(board - target);
};

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const clickTarget = (target: number) => {
    if (!ctx.isClientMoveAllowed || !isMoveValid(board, target)) return;
    moves.moveTo(board, target);
  };

  return (
    <GameBoard>
      <div className="flex flex-wrap gap-2">
        {range(maxStart + 1).map(i =>
          <button
            key={i}
            disabled={!ctx.isClientMoveAllowed || !isMoveValid(board, i)}
            onClick={() => clickTarget(i)}
            className={`
              border-2 rounded-sm text-2xl min-w-[4ch] p-1 my-1 font-bold
              enabled:bg-green-200 dark:enabled:bg-green-700 enabled:hocus:bg-green-400 dark:enabled:hocus:bg-green-600
              ${i === 0 ? 'border-slate-900 dark:border-slate-400 border-dashed' : ''}
              ${i > board ? 'opacity-50' : ''}
            `}
          >
            {i === board ? 'X' : i}
          </button>
        )}
      </div>
    </GameBoard>
  );
};

const moves = {
  moveTo: (_board: Board, { ctx, events }: { ctx: Ctx, events: Events }, target: number) => {
    const winner = ctx.currentPlayer!;
    events.endTurn();
    if (target === 0) {
      events.endGame(winner);
    }
    return { nextBoard: target };
  }
};

const randomBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  const step = isValidStep(board) ? board : sample([...validSteps].filter(s => s < board))!;
  moves.moveTo(board, board - step);
};

const smartBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  const remainder = board % 4;
  let step: number;
  if (remainder !== 0) {
    // all valid steps ≡ remainder (mod 4) land on a multiple of 4
    const winningSteps = [...validSteps].filter(s => s <= board && (board - s) % 4 === 0);
    step = sample(winningSteps)!;
  } else {
    // losing position: pick any valid step
    const steps = [...validSteps].filter(s => s <= board);
    step = sample(steps)!;
  }
  moves.moveTo(board, board - step);
};

const generateStartBoard = (): Board => {
  const positions = range(minStart, maxStart + 1);
  const pPositions = positions.filter(n => n % 4 === 0);
  const nPositions = positions.filter(n => n % 4 !== 0);
  const pool = Math.random() < 0.5 ? pPositions : nPositions;
  return sample(pool)!;
};

const rule = {
  hu: <>
    A bábu a 30 és 80 közé eső egyik mezőről indul. A soron következő játékos a bábut egy kisebb
    sorszámú mezőre lépteti, de a lépés mérete (a két mező sorszámának különbsége) sosem lehet
    összetett szám. Az nyer, aki a 0 mezőre lép.
  </>,
  en: <>
    The piece starts on a field numbered between 30 and 80. On each turn, the current player moves
    the piece to a lower-numbered field, but the step size (the difference between the two field
    numbers) can never be a composite number. The player who reaches field 0 wins.
  </>
};

export const PrimelyToZero = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription: () => ({
      hu: 'Válaszd ki, melyik mezőre lépsz.',
      en: 'Choose which field to move to.'
    })
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt 🤖', en: 'Test 🤖' } },
    { botStrategy: smartBotStrategy, generateStartBoard, label: { hu: 'Okos 🤖', en: 'Smart 🤖' }, isDefault: true }
  ]
});
