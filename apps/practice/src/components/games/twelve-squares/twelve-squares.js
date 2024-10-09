import React, { useState } from 'react';
import { strategyGameFactory } from '../strategy-game';
import { range, random } from 'lodash';
import { ChessBishopSvg } from '../chess-bishops/chess-bishop-svg';

const generateStartBoard = () => {
  return { left: 1, right: 12 };
};

const getGameStateAfterMove = (nextBoard) => {
	return { nextBoard, isGameEnd: nextBoard.right < nextBoard.left, winnerIndex: null };
};

const getGameStateAfterAiTurn = ({ board, ctx }) => {
  const step = getOptimalAiStep(board);
  const nextBoard = ctx.playerIndex === 0
    ? { left: board.left, right: board.right - step }
    : { left: board.left + step, right: board.right };
  return getGameStateAfterMove(nextBoard);
};

const getOptimalAiStep = ({ left, right }) => {
  let dst = right-left;
  if(dst === 1) return 2;
  if(dst === 2) return 1;
  if(dst % 3 === 2) return random(1,2);
  return (dst+1) % 3;
};

const GameBoard = ({ board, ctx, events }) => {
  const isMoveAllowed = (step) => {
	  if(!ctx.shouldPlayerMoveNext) return false;
    if (step === board.right - board.left) return false;
    return step === 1 || step === 2;
  };

  const makeStep = (step) => {
    if (!isMoveAllowed(step)) return;
    const nextBoard = ctx.playerIndex === 0
      ? { left: board.left + step, right: board.right }
      : { left: board.left, right: board.right - step };
	  events.endPlayerTurn(getGameStateAfterMove(nextBoard));
  };

  const potentialStep = i => {
    return ctx.playerIndex === 0 ? i - board.left : board.right - i;
  }

  const cellBackground = (i) => {
    if (isMoveAllowed(potentialStep(i))) {
      return 'bg-green-200 hover:bg-green-400 focus:bg-green-400';
    }
    if (( i === board.left && ctx.playerIndex === 0) || (i === board.right && ctx.playerIndex === 1)) {
      return 'bg-green-400';
    }
    if (( i === board.left && ctx.playerIndex === 1) || (i === board.right && ctx.playerIndex === 0)) {
      return 'bg-purple-400';
    }
    return 'bg-slate-200';
  };

  return (
  <section className="p-2 shrink-0 grow basis-2/3">
    <ChessBishopSvg/>
    <table className="w-full table-fixed">
      <tbody>
      <tr>
        {range(1,13).map(i =>
          <td
            key={i}
            className={`
              text-xl text-center p-0.5 font-bold aspect-square border-2 border-white
              ${cellBackground(i)}
            `}
          >
            <button
              className="w-full"
              disabled={!isMoveAllowed(potentialStep(i))}
              onClick={() => makeStep(potentialStep(i))}
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
</>;

export const TwelveSquares = strategyGameFactory({
  rule,
  title: 'Tizenkét mező',
  GameBoard,
  getPlayerStepDescription: ({ ctx: { playerIndex } }) => playerIndex === 0
    ? 'Kattints a mezőre ahova lépni szeretnél a bal oldali bábuval.'
    : 'Kattints a mezőre ahova lépni szeretnél a jobb oldali bábuval.',
  generateStartBoard,
  getGameStateAfterAiTurn
});
