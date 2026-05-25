import { strategyGameFactory, type Events, type StrategyArgs, type BoardClientProps } from '../../game-factory';
import { range, sum, sample, cloneDeep } from 'lodash';
import { useTranslation } from '../../language/translate';

type Board = number[]

const COVERED = -1 as const;

const getRemaining = (board: Board) => board.filter(i => i !== COVERED);

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();

  const clickNumber = (number) => {
    if (!ctx.isClientMoveAllowed) return;
    moves.coverNumber(board, number);
  };

  return(
    <section className="p-2 shrink-0 grow basis-2/3">
    <table className="border-collapse table-fixed w-full">
      <tbody>
        <tr>
        {range(board.length).map(i => (
          board[i]!== COVERED
          ? <td
              className='border-4 aspect-square text-center'
              key = {i}
            >
              <button
                disabled={!ctx.isClientMoveAllowed}
                className='w-full enabled:hover:bg-gray-400 enabled:focus:bg-gray-400'
                onClick={() => clickNumber(i+1)}
              >
                {board[i]}
              </button>
            </td>
          : <td
              className='text-center border-4 bg-gray-600'
              key = {i}
            >X</td>
        ))}
        </tr>
      </tbody>
    </table>
    <p>
      {t({ hu: 'Megmaradt számok összege', en: 'Sum of remaining numbers' })}
      : {sum(getRemaining(board))}
    </p>
    </section>
  );
};

const randomBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  moves.coverNumber(board, sample(getRemaining(board)));
};

const smartBotStrategy = ({ board, ctx, moves }: StrategyArgs<Board>) => {
  const botMove = getOptimalSmartBotMove(board, ctx.chosenRoleIndex);
  moves.coverNumber(board, botMove);
};

const getOptimalSmartBotMove = (board: Board, chosenRoleIndex) => {
  const remaining = getRemaining(board);
  const evens = remaining.filter(i => i%2 === 0);
  const odds = remaining.filter(i => i%2 === 1);
  if (evens.length === odds.length || evens.length === 0 || odds.length === 0) {
    return sample(remaining);
  } else {
    if (chosenRoleIndex === 0){
      const candidates = evens.length > odds.length ? evens : odds;
      return sample(candidates);
    } else {
      const candidates = evens.length > odds.length ? odds : evens;
      return sample(candidates);
    }
  }
};

const rule8 = {
  hu: <>
    Egy táblázatban 1-től 8-ig szerepelnek a számok. Két játékos felváltva takar le egy-egy
    számot addig, amíg csak két szám marad. Ha a megmaradt két szám összege páros, akkor a kezdő
    nyer, ha pedig páratlan, akkor a második.
  </>,
  en: <>
    A table contains the numbers 1 to 8. Two players take turns covering one number at a time
    until only two numbers remain. If the sum of the two remaining numbers is even, the first
    player wins; if it is odd, the second player wins.
  </>
};

const rule10 = {
  hu: <>
    Egy táblázatban 1-től 10-ig szerepelnek a számok. Két játékos felválva takar le egy-egy
    számot addig, amíg csak két szám marad. Ha a megmaradt két szám összege páros, akkor a kezdő
    nyer, ha pedig páratlan, akkor a második.
  </>,
  en: <>
    A table contains the numbers 1 to 10. Two players take turns covering one number at a time
    until only two numbers remain. If the sum of the two remaining numbers is even, the first
    player wins; if it is odd, the second player wins.
  </>
};

const moves = {
  coverNumber: (board: Board, { events }: { events: Events }, number) => {
    const nextBoard = cloneDeep(board);
    nextBoard[number-1] = COVERED;
    events.endTurn();

    const remaining = getRemaining(nextBoard);
    if (remaining.length === 2) {
      events.endGame(sum(remaining) % 2);
    }
    return { nextBoard };
  }
}

const getPlayerStepDescription = () => ({
  hu: 'Kattints egy számra, hogy lefedd.',
  en: 'Click a number to cover it.'
});

export const NumberCovering8 = strategyGameFactory({
  presentation: {
    rule: rule8,
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt 🤖', en: 'Test 🤖' } },
    {
      botStrategy: smartBotStrategy,
      generateStartBoard: () => range(1, 9),
      label: { hu: 'Okos 🤖', en: 'Smart 🤖' },
      isDefault: true
    }
  ]
});

export const NumberCovering10 = strategyGameFactory({
  presentation: {
    rule: rule10,
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt 🤖', en: 'Test 🤖' } },
    {
      botStrategy: smartBotStrategy,
      generateStartBoard: () => range(1, 11),
      label: { hu: 'Okos 🤖', en: 'Smart 🤖' },
      isDefault: true
    }
  ]
});
