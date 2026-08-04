import { strategyGameFactory, type BotStrategy, type BoardClientProps, GameBoard } from '../../strategy-game-factory';
import { range, sum, sample } from 'lodash';
import { useTranslation } from '../../../language';
import { generateTestStartBoard, getRemaining, moves, type Board, COVERED, type Moves } from './gameplay';

const BoardClient = ({ board, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();


  return(
    <GameBoard>
      <div className="flex flex-wrap gap-1">
      {range(board.length).map(i => (
        <button
          key={i}
          disabled={!moves.coverNumber.isAllowed(board, i + 1)}
          className={`secondary-button w-auto text-2xl min-w-[3ch]`}
          onClick={() => moves.coverNumber(board, i + 1)}
        >
          {board[i] === COVERED ? 'X' : board[i]}
        </button>
      ))}
      </div>
      <p className="mt-2">
        {t({ hu: 'Megmaradt számok összege', en: 'Sum of remaining numbers' })}
        : {sum(getRemaining(board))}
      </p>
    </GameBoard>
  );
};

type Bot = BotStrategy<Board, Moves>

const randomBotStrategy: Bot = ({ board }) =>
  ({ move: 'coverNumber', args: [sample(getRemaining(board))!] });

export const smartBotStrategy: Bot = ({ board, ctx }) => {
  const remaining = getRemaining(board);
  const evens = remaining.filter(i => i%2 === 0);
  const odds = remaining.filter(i => i%2 === 1);
  if (evens.length === odds.length || evens.length === 0 || odds.length === 0) {
    return { move: 'coverNumber', args: [sample(remaining)!] };
  } else if (ctx.currentPlayer === 0) {
    // first player wants same-parity survivors -> remove from the smaller class
    const candidates = evens.length < odds.length ? evens : odds;
    return { move: 'coverNumber', args: [sample(candidates)!] };
  } else {
    // second player wants a mixed pair -> remove from the larger class
    const candidates = evens.length > odds.length ? evens : odds;
    return { move: 'coverNumber', args: [sample(candidates)!] };
  }
};

const makeRule = (maxNumber: number) => ({
  hu: <>
    Egy táblázatban 1-től {maxNumber}-ig szerepelnek a számok. Két játékos felváltva takar le egy-egy
    számot addig, amíg csak két szám marad. Ha a megmaradt két szám összege páros, akkor a kezdő
    nyer, ha pedig páratlan, akkor a második.
  </>,
  en: <>
    A table contains the numbers 1 to {maxNumber}. Two players take turns covering one number at a time
    until only two numbers remain. If the sum of the two remaining numbers is even, the first
    player wins; if it is odd, the second player wins.
  </>
});

const genericRule = {
  hu: <>
    Egy táblázatban 1-től kezdődően néhány szám szerepel. Két játékos felváltva takar le egy-egy
    számot addig, amíg csak két szám marad. Ha a megmaradt két szám összege páros, akkor a kezdő
    nyer, ha pedig páratlan, akkor a második.
  </>,
  en: <>
    A table contains the numbers starting from 1. Two players take turns covering one number at a time
    until only two numbers remain. If the sum of the two remaining numbers is even, the first
    player wins; if it is odd, the second player wins.
  </>
};

const getPlayerStepDescription = () => ({
  hu: 'Kattints egy számra, hogy lefedd.',
  en: 'Click a number to cover it.'
});

export const NumberCovering = strategyGameFactory({
  presentation: {
    rule: genericRule,
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
    // smart bot: verified as optimal
    {
      botStrategy: smartBotStrategy,
      generateStartBoard: () => range(1, 9),
      rule: makeRule(8),
      label: { hu: '8 szám', en: '8 numbers' },
      isDefault: true
    },
    {
      botStrategy: smartBotStrategy,
      generateStartBoard: () => range(1, 11),
      rule: makeRule(10),
      label: { hu: '10 szám', en: '10 numbers' }
    }
  ]
});
