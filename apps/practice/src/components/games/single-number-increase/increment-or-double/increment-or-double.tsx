import { strategyGameFactory, type BoardClientProps, GameBoard } from '../../../strategy-game-factory';
import { isLosing, moves, target, type Board } from './gameplay';
import { smartBotStrategy } from './bot-strategy';

const BoardClient = ({ board, moves }: BoardClientProps<Board>) => {
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
        {actionButton('x+1', incResult, () => moves.increment(board), !moves.increment.isAllowed(board))}
        {actionButton('2x', dblResult, () => moves.double(board), !moves.double.isAllowed(board))}
      </div>
    </GameBoard>
  );
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
  variants: [{ botStrategy: smartBotStrategy, generateStartBoard: () => 0 }]
});
