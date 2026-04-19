import React from 'react';
import { strategyGameFactory } from '../strategy-game';
import { range, random } from 'lodash';
import { ChessBishopSvg } from '../chess-bishops/chess-bishop-svg';
import { gameList } from '../gameList';

const BoardClient = ({ board, ctx, moves }) => {
  const isMoveAllowed = (step) => {
	  if(!ctx.isClientMoveAllowed) return false;
    if (step === board.right - board.left) return false;
    return step === 1 || step === 2;
  };

  const makeStep = (step) => {
    if (!isMoveAllowed(step)) return;
    moves.step(board, step);
  };

  const potentialStep = i => {
    return ctx.currentPlayer === 0 ? i - board.left : board.right - i;
  }

  const cellBackground = (i) => {
    if (i === board.left) return 'bg-green-400';
    if (i === board.right) return 'bg-purple-400';
    if (isMoveAllowed(potentialStep(i))) {
      return ctx.currentPlayer === 0
        ? 'bg-green-200 hover:bg-green-400 focus:bg-green-400'
        : 'bg-purple-200 hover:bg-purple-400 focus:bg-purple-400';
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

const aiBotStrategy = ({ board, moves }) => {
  const step = getOptimalAiStep(board);
  moves.step(board, step);
};

const getOptimalAiStep = ({ left, right }) => {
  let dst = right-left;
  if(dst === 1) return 2;
  if(dst === 2) return 1;
  if(dst % 3 === 2) return random(1,2);
  return (dst+1) % 3;
};

const moves = {
  step: (board, { ctx, events }, step) => {
    const nextBoard = ctx.currentPlayer === 0
      ? { left: board.left + step, right: board.right }
      : { left: board.left, right: board.right - step };
    events.endTurn();
    if (nextBoard.right < nextBoard.left) {
      events.endGame();
    }
    return { nextBoard };
  }
};

const rule = {
  hu: <>
    Van 12 mező egymás mellett. A két szélsőbe lerakunk egy-egy bábut. Ezután a játékosok
    felváltva lépnek egyet vagy kettőt a saját bábujukkal a másik irányába. A másik bábujára rálépni nem
    szabad. Az nyer, aki átugorja az ellenfél bábuját.
  </>,
  en: <>
    A 1 × 12 board is given with one piece placed on each end.
    Players take turns moving their piece toward the other, advancing one or two squares at a time.
    A player may not move to a square already occupied by the opponent's piece.
    The player who jumps over their opponent's piece wins.
  </>
};

export const TwelveSquares = strategyGameFactory({
  rule,
  metadata: gameList.TwelveSquares,
  BoardClient,
  getPlayerStepDescription: ({ ctx: { currentPlayer } }) => currentPlayer === 0
    ? {
      hu: 'Kattints a mezőre ahova lépni szeretnél a bal oldali bábuval.',
      en: 'Click the square you want to move to with the left piece.'
    }
    : {
      hu: 'Kattints a mezőre ahova lépni szeretnél a jobb oldali bábuval.',
      en: 'Click the square you want to move to with the right piece.'
    },
  generateStartBoard: () => ({ left: 1, right: 12 }),
  aiBotStrategy,
  moves
});
