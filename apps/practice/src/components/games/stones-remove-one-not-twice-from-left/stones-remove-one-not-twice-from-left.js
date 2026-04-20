import React, { useState } from 'react';
import { strategyGameFactory } from '../strategy-game';
import { cloneDeep, isEqual, sample, random, range } from 'lodash';
import { gameList } from '../gameList';
import { useTranslation } from '../../language/translate';

const StonePile = ({ count, onClick, disabled, restricted }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      className={`w-full flex-1 flex flex-wrap content-start justify-center gap-2 p-2
        disabled:cursor-not-allowed ${restricted ? 'opacity-50' : ''}`}
      style={{ transform: 'scaleY(-1)' }}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      {range(count).map(i => (
        <div
          key={i}
          className={`w-[20%] aspect-square rounded-full bg-stone-500 shadow-md shadow-stone-700
            transition-opacity ${hovered && !disabled && i === count - 1 ? 'opacity-30' : ''}`}
          style={{ transform: 'scaleY(-1)' }}
        />
      ))}
    </button>
  );
};

const BoardClient = ({ board, ctx, moves }) => {
  const { t } = useTranslation();

  const isMoveAllowed = pileId => {
    if (!ctx.isClientMoveAllowed) return false;
    if (board.piles[pileId] === 0) return false;
    if (pileId === 0 && board.leftRestriction[ctx.currentPlayer]) return false;
    return true;
  }

  return (
    <section className="p-2 shrink-0 grow basis-2/3">
      <div className="flex">
        {[0, 1].map(pileId => (
          <div key={pileId} className="grow px-2 flex flex-col">
            <p className="text-xl font-semibold text-center text-stone-600">{board.piles[pileId]}</p>
            <StonePile
              count={board.piles[pileId]}
              onClick={() => moves.removeStone(board, pileId)}
              disabled={!isMoveAllowed(pileId)}
              restricted={ctx.isClientMoveAllowed && !isMoveAllowed(pileId)}
            />
            <p className="text-center font-semibold text-stone-600">
              {t(pileId === 0 ? { hu: 'Bal', en: 'Left' } : { hu: 'Jobb', en: 'Right' })}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

const moves = {
  removeStone: (board, { ctx, events }, pileId) => {
    const nextBoard = cloneDeep(board);
    nextBoard.piles[pileId] = board.piles[pileId] - 1;
    nextBoard.leftRestriction[ctx.currentPlayer] = (pileId === 0);
    events.endTurn();
    if (isGameEnd(nextBoard, ctx)) {
      events.endGame();
    }
    return { nextBoard };
  }
};

const isGameEnd = (board, ctx) => {
  if (isEqual(board.piles, [0, 0])) {
    return true;
  }
  if (board.piles[1] === 0 && board.leftRestriction[1 - ctx.currentPlayer]) {
    return true;
  }
  return false;
}

const aiBotStrategy = ({ board, ctx, moves }) => {
  if (board.leftRestriction[ctx.currentPlayer]) {
    moves.removeStone(board, 1);
    return;
  }
  const optimalMove = getOptimalMove(board, ctx);
  const botMove = optimalMove !== undefined
    ? optimalMove
    : getPileOfRandomAllowedMove(board, ctx);
  moves.removeStone(board, botMove);
};

// return undefined if there is no winning move
const getOptimalMove = (board, ctx) => {
  const otherPlayer = 1 - ctx.currentPlayer;
  const parity = [board.piles[0] % 2 === 0, board.piles[1] % 2 === 0]

  if (parity[0] && parity[1]) {
    if (!board.leftRestriction[otherPlayer]) {
      return undefined;
    } else if (board.leftRestriction[ctx.currentPlayer]) {
      console.error("Unexpected internal state, please report.")
      return undefined;
    } else {
      /*
      If we take right, the other must take right, then we are in an even-even
      position without any restriction which is a losing position. Check winning
      move in next round if we take left (and the other must take right). If
      there is a winning move next round it means taking from left now is also a
      winning move. Otherwise we do not have a winning move.
      */
      const nextRestriction = [false, false];
      nextRestriction[ctx.currentPlayer] = true;
      nextRestriction[1 -ctx.currentPlayer] = false;
      const nextBoard = {
        piles: [board.piles[0] - 1, board.piles[1] - 1],
        leftRestriction: nextRestriction
      }
      const optimalMoveInNextRound = getOptimalMove(nextBoard, ctx);
      return optimalMoveInNextRound !== undefined ? 0 : undefined;
    }
  }
  if (parity[0] && !parity[1]) {
    return 1;
  }
  if (!parity[0] && !parity[1]) {
    if (board.piles[0] > board.piles[1]) {
      return 1;
    } else {
      return undefined;
    }
  }
  if (!parity[0] && parity[1]) {
    if (board.piles[0] <= (board.piles[0] + 1)) {
      if (!board.leftRestriction[ctx.currentPlayer]) {
        return 0;
      } else {
        console.error("Unexpected internal state, please report.")
        return undefined;
      }
    } else {
      return undefined;
    }
  }

  // we should not reach this branch;
  return undefined;
}

const getPileOfRandomAllowedMove = (board, ctx) => {
  if (board.piles[0] === 0) return 1;
  if (board.piles[1] === 0) return 0;
  if (board.leftRestriction[ctx.currentPlayer]) return 1;
  return random(0, 1);
}

const rule = {
  hu: <>
    Két kupacban kavicsok vannak elhelyezve. A két játékos felváltva
    lép, és minden lépés során egy kavicsot kell elvenniük valamelyik kupacból.
    Egy játékos azonban nem vehet el két egymást követő lépésben a bal oldali
    kupacból. Az veszít, aki nem tud lépni.
  </>,
  en: <>
    There are two piles of stones. Players alternate turns, and on each turn a player must
    remove one stone from either pile. However, a player may not take from the
    left pile on two consecutive turns. The player who cannot move loses.
  </>
};

const getPlayerStepDescription = () => ({
  hu: 'Kattints a kupacra ahonnan el szeretnél venni egy kavicsot.',
  en: 'Click the pile you want to remove a stone from.'
});

const generateStartBoard = () => {
  const piles = sample([
    [11, 8],
    [9, 9],
    [9, 8],
    [9, 7],
    [5, 8],
    [8, 7],
    [6, 4]
  ])
  return {
    piles,
    leftRestriction: [false, false]
  };
}

export const StonesRemoveOneNotTwiceFromLeft = strategyGameFactory({
  rule,
  metadata: gameList.StonesRemoveOneNotTwiceFromLeft,
  BoardClient,
  getPlayerStepDescription,
  generateStartBoard,
  aiBotStrategy,
  moves
});
