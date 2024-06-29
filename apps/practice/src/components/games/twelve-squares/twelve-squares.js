import React, { useState } from 'react';
import { strategyGameFactory } from '../strategy-game';
import { range } from 'lodash';
import { getOptimalAiStep } from './strategy';
import { ChessBishopSvg } from '../chess-bishops/chess-bishop-svg';

const generateNewBoard = () => {
  return { left: 1, right: 12 };
};

const getGameStateAfterMove = (board, step, moverIndex) => {
	let l = board.left, r = board.right;

  if(moverIndex === 0) {
    l += step;
    if(l === r) l++;
  } else {
    r -= step;
    if(l === r) r--;
  }

  const isGameEnd = l > r;

  return {
	  newBoard: { left: l, right: r },
	  isGameEnd,
	  winnerIndex: isGameEnd ? moverIndex : null
  };
};

const getGameStateAfterAiTurn = ({ board, playerIndex }) => {
  const step = getOptimalAiStep(board);
  return getGameStateAfterMove(board, step, 1-playerIndex);
};

const GameBoard = ({ board, ctx }) => {
  const isMoveAllowed = (step) => {
	  if(!ctx.shouldPlayerMoveNext) return false;
	  if(ctx.playerIndex === 0) {
      return (step > 0 && step <= 2 && step+board.left !== board.right);
    }

	  return (step < 0 && step >= -2 && step+board.right !== board.left);
  };

  const makeStep = (step) => {
	  // if (!isMoveAllowed(step)) return;
	  ctx.endPlayerTurn(getGameStateAfterMove(board, step, ctx.playerIndex));
  };

  return (
  <section className="p-2 shrink-0 grow basis-2/3">
    <ChessBishopSvg/>
    <table className="w-full table-fixed">
      <tbody>
      <tr>
        {range(1,13).map(i =>
          <td
          className={`
            text-xl text-center p-0.5 font-bold aspect-square border-2 border-white
            ${isMoveAllowed(ctx.playerIndex === 0 ? i-board.left : i-board.right) ?
              'bg-green-200 hover:bg-green-400' :
              (( i === board.left && ctx.playerIndex === 0) || (i === board.right && ctx.playerIndex === 1) ? 'bg-green-400' :
              ( i === board.left || i === board.right ) ? 'bg-purple-400' :'bg-slate-200')
            }
          `}
          >
            <button
              key={i}
              className="w-full"
              disabled={!isMoveAllowed(ctx.playerIndex === 0 ? i-board.left : i-board.right)}
              onClick={() => makeStep(ctx.playerIndex === 0 ? i-board.left : board.right-i)}
            >{ i === board.left || i === board.right
              ? <span>
                <svg className="inline-block w-full aspect-square">
                  <use xlinkHref="#game-chess-bishop" />
                </svg>
              </span> : i }
            </button>
          </td>
        )}
      </tr>
      </tbody>
    </table>
  </section>
  );
};

const rule = <>
	Van 12 mező egymás mellett. A két szélsőbe lerakunk egy-egy bábut. Ezután a játékosok
	felváltva lépnek egyet vagy kettőt a saját bábujukkal a másik irányába. A másik bábujára rálépni nem
	szabad. Az nyer, aki átugorja az ellenfél bábuját.
  Sok sikert! :)
</>;

const Game = strategyGameFactory({
  rule,
  title: 'Tizenkét mező',
  GameBoard,
  G: {
	  getPlayerStepDescription: ({ playerIndex }) => playerIndex === 0
      ? 'Kattints a mezőre ahova lépni szeretnél a bal oldali bábuval.'
      : 'Kattints a mezőre ahova lépni szeretnél a jobb oldali bábuval.',
	  generateNewBoard,
	  getGameStateAfterAiTurn
  }
});

export const TwelveSquares = () => {
  const [board, setBoard] = useState(generateNewBoard());

  return <Game board={board} setBoard={setBoard} />;
};
