import React from 'react';
import { strategyGameFactory } from '../../game-factory/strategy-game';
import { range, sum, sample, cloneDeep } from 'lodash';
import { gameList } from '../gameList';
import { useTranslation } from '../../language/translate';

const BoardClient = ({ board, ctx, moves }) => {
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
          board[i]!==-1
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
    <p>{t({ hu: 'Megmaradt számok összege', en: 'Sum of remaining numbers' })}: {sum(board.filter(i => i > 0))}</p>
    </section>
  );
};

const aiBotStrategy = ({ board, ctx, moves }) => {
  const aiMove = getOptimalAiMove(board, ctx.chosenRoleIndex);
  moves.coverNumber(board, aiMove);
};

const getOptimalAiMove = (board, chosenRoleIndex) => {
  const notCovered = board.filter(i => i !== -1);
  const evens = notCovered.filter(i => i%2 === 0);
  const odds = notCovered.filter(i => i%2 === 1);
  if (evens.length === odds.length || evens.length === 0 || odds.length === 0) {
    return sample(notCovered);
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
  coverNumber: (board, { events }, number) => {
    const nextBoard = cloneDeep(board);
    nextBoard[number-1] = -1;
    events.endTurn();

    const remaining = nextBoard.filter(i => i>0);
    if (remaining.length === 2) {
      events.endGame({ winnerIndex: sum(remaining) % 2 });
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
    title: gameList.NumberCovering8.title || gameList.NumberCovering8.name,
    credit: gameList.NumberCovering8.credit,
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  variants: [{ botStrategy: aiBotStrategy, generateStartBoard: () => range(1, 9) }]
});

export const NumberCovering10 = strategyGameFactory({
  presentation: {
    rule: rule10,
    title: gameList.NumberCovering10.title || gameList.NumberCovering10.name,
    credit: gameList.NumberCovering10.credit,
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  variants: [{ botStrategy: aiBotStrategy, generateStartBoard: () => range(1, 11) }]
});
