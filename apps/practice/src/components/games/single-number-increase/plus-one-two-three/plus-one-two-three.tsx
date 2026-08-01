import {
  strategyGameFactory,
  type Ctx, type Events, type StrategyArgs, type BoardClientProps,
  GameBoard
} from '../../../strategy-game-factory';
import { range, random } from 'lodash';

type Board = number

const target = 40;
const maxStep = 3;

const BoardClient = ({ board, moves }: BoardClientProps<Board>) => {


  return(
    <GameBoard>
      <div className="flex flex-wrap gap-2">
      {range(target + maxStep + 1).map(i =>
        <button
          key={i}
          disabled={!moves.increaseTo.isAllowed!(board, i)}
          onClick={() => moves.increaseTo(board, i)}
          className={`
            border-2 rounded-sm text-2xl min-w-[4ch] p-1 my-1 font-bold
            enabled:bg-green-200 dark:enabled:bg-green-700 enabled:hocus:bg-green-400 dark:enabled:hocus:bg-green-600
            ${i === target ? 'border-slate-900 dark:border-slate-400 border-dashed' : '' }
            ${i < board ? 'opacity-50' : ''}
            ${i > target ? 'opacity-50 border-red-600' : ''}
          `}
        >{ i === board ? 'X' : i }
      </button>
      )}
    </div>
    </GameBoard>
  );
};

// A step advances to a strictly larger whole number, by at most maxStep.
export const isIncreaseValid = ({ board, number }: { board: Board; number: number }): boolean =>
  Number.isInteger(number) && number > board && (number - board) <= maxStep;

const moves = {
  increaseTo: {
    validate: (board: Board, _, number: number) => isIncreaseValid({ board, number }),
    apply: (board: Board, { ctx, events }: { ctx: Ctx, events: Events }, number) => {
      events.endTurn();
      if (number > target) {
        events.endGame(1 - ctx.currentPlayer!)
      }
      return { nextBoard: number }
    }
  }
};

const smartBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  const nextBoard = board % (1 + maxStep) !== 0
    ? board + (1 + maxStep) - board % (1 + maxStep)
    : board + random(1, maxStep);
  moves.increaseTo(board, nextBoard);
};

const rule = {
  hu: <>
    A játék a nullával indul. A játékosok felváltva
    lépnek a pozitív egész számokon: a soron következő játékos mindig 1-gyel, 2-vel vagy 3-mal
    léphet előre. Az veszít, aki először lép {target}-nél nagyobb számra.
  </>,
  en: <>
    The game starts at zero. Players take turns moving along the positive integers: each player
    may advance by 1, 2, or 3. The player who first steps past {target} loses.
  </>
};

export const PlusOneTwoThree = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription: () => ({
      hu: 'Válaszd ki, hogy melyik számra lépsz.',
      en: 'Choose which number to step to.'
    })
  },
  BoardClient,
  gameplay: { moves },
  // smart bot: verified as optimal
  variants: [{ botStrategy: smartBotStrategy, generateStartBoard: () => 0 }]
});
