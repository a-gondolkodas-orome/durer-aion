import {
  strategyGameFactory, type Ctx, type Events, type StrategyArgs, type BoardClientProps, GameBoard
} from '../../../game-factory';
import { sample } from 'lodash';

// `board` is the last number said. 0 means nothing has been said yet, so the
// starting player must open with 1 (their only legal move from 0).
type Board = number

const target = 99;

const isLosing = (n: number) => n > target;

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const canMove = ctx.isClientMoveAllowed;
  const incResult = board + 1;
  const dblResult = board * 2;

  const actionButton = (
    label: string, result: number, onClick: () => void, disabled: boolean
  ) => (
    <button
      className={`primary-button w-auto grow ${isLosing(result) ? 'bg-red-600 hocus:bg-red-500' : ''}`}
      disabled={disabled}
      onClick={onClick}
    >{label} → {result}</button>
  );

  return(
    <GameBoard>
      <h2 className="text-center text-5xl font-bold my-4">{board}</h2>
      <div className="flex flex-wrap gap-2">
        {actionButton('x+1', incResult, () => moves.increment(board), !canMove)}
        {actionButton('2x', dblResult, () => moves.double(board), !canMove || board === 0)}
      </div>
    </GameBoard>
  );
};

const say = (next: number, { ctx, events }: { ctx: Ctx, events: Events }) => {
  events.endTurn();
  if (isLosing(next)) {
    events.endGame(1 - ctx.currentPlayer!);
  }
  return { nextBoard: next };
};

const moves = {
  increment: (board: Board, meta: { ctx: Ctx, events: Events }) => say(board + 1, meta),
  double: (board: Board, meta: { ctx: Ctx, events: Events }) => say(board * 2, meta)
};

// The mover wins exactly when the last number said is even, so the only winning
// move is always x+1 (which hands the opponent an odd number). From 0 this plays
// the forced opening 1. From an odd (losing) board both moves hand the opponent an
// even, winning number, so play randomly to maximise the chance the human errs.
export const getBotNextNumber = (board: Board): number => {
  if (board % 2 === 0) return board + 1;
  return sample([board + 1, board * 2])!;
};

const smartBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  const next = getBotNextNumber(board);
  if (next === board * 2) {
    moves.double(board);
  } else {
    moves.increment(board);
  }
};

const rule = {
  hu: <>
    A két játékos pozitív egész számokat mond felváltva úgy, hogy ha az előző által mondott
    szám x, akkor a következő x + 1-et vagy 2x-et mondhat. A kezdő játékosnak 1-et kell mondania.
    Az veszít, aki először mond {target}-nél nagyobb számot.
  </>,
  en: <>
    The two players alternately say positive integers: if the previous number said is x, the next
    player may say x + 1 or 2x. The starting player must say 1. Whoever first says a number greater
    than {target} loses.
  </>
};

const getPlayerStepDescription = ({ board }: { board: Board }) => {
  if (board === 0) {
    return { hu: 'Mondd az első számot: 1.', en: 'Say the first number: 1.' };
  }
  return {
    hu: 'Mondj eggyel nagyobb (x+1) vagy kétszer akkora (2x) számot.',
    en: 'Say one more (x+1) or double (2x).'
  };
};

export const IncrementOrDouble = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  // smart bot: verified as optimal
  variants: [{ botStrategy: smartBotStrategy, generateStartBoard: () => 0 }]
});
