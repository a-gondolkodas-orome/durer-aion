import {
  strategyGameFactory,
  type Ctx, type Events, type StrategyArgs, type BoardClientProps,
  GameBoard
} from '../../game-factory';
import { range, random } from 'lodash';

type Board = number

const target = 40;
const maxStep = 3;

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {

  const isMoveAllowed = number => {
    if (!ctx.isClientMoveAllowed) return false;
    return isIncreaseValid({ board, number });
  }

  const clickNumber = (number) => {
    if (!isMoveAllowed(number)) return;
    moves.increaseTo(board, number);
  };

  return(
    <GameBoard>
      <div className="flex flex-wrap gap-2">
      {range(target + maxStep + 1).map(i =>
        <button
          key={i}
          disabled={!isMoveAllowed(i)}
          onClick={() => clickNumber(i)}
          className={`
            border-2 rounded-sm text-2xl min-w-[4ch] p-1 my-1 font-bold
            enabled:bg-green-200 enabled:hocus:bg-green-400
            ${i === target ? 'border-slate-900 border-dashed' : '' }
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

const isIncreaseValid = ({ board, number }) => {
  if (number <= board) return false;
  return (number - board) <= maxStep;
}

const moves = {
  increaseTo: (board: Board, { ctx, events }: { ctx: Ctx, events: Events }, number) => {
    if (!isIncreaseValid({ board, number })) {
      console.error('invalid_move');
    }
    events.endTurn();
    if (number > target) {
      events.endGame(1 - ctx.currentPlayer!)
    }
    return { nextBoard: number }
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
