import React from 'react';
import { strategyGameFactory } from '../strategy-game';
import { range, sum, sample, cloneDeep } from 'lodash';
import { gameList } from '../gameList';

const BoardClient = ({ board, ctx, moves }) => {

  const clickNumber = (number) => {
    if (!ctx.shouldRoleSelectorMoveNext) return;
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
                disabled={!ctx.shouldRoleSelectorMoveNext}
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
    <p>Megmaradt számok összege: {sum(board.filter(i => i > 0))}</p>
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

const rule8 = <>
Egy táblázatban 1-től 8-ig szerepelnek a számok. Két játékos felváltva takar le egy-egy
számot addig, amíg csak két szám marad. Ha a megmaradt két szám összege páros, akkor a kezdő
nyer, ha pedig páratlan, akkor a második.
</>;

const rule10 = <>
Egy táblázatban 1-től 10-ig szerepelnek a számok. Két játékos felválva takar le egy-egy
számot addig, amíg csak két szám marad. Ha a megmaradt két szám összege páros, akkor a kezdő
nyer, ha pedig páratlan, akkor a második.
</>;

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

export const NumberCovering8 = strategyGameFactory({
  rule: rule8,
  metadata: gameList.NumberCovering8,
  BoardClient,
  getPlayerStepDescription: () => 'Kattints egy számra, hogy lefedd.',
  generateStartBoard: () => range(1, 9),
  moves,
  aiBotStrategy
});

export const NumberCovering10 = strategyGameFactory({
  rule: rule10,
  metadata: gameList.NumberCovering10,
  BoardClient,
  getPlayerStepDescription: () => 'Kattints egy számra, hogy lefedd.',
  generateStartBoard: () => range(1, 11),
  moves,
  aiBotStrategy
});
