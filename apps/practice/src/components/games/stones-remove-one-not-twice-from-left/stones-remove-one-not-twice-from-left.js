import React from 'react';
import { strategyGameFactory } from '../strategy-game';
import { cloneDeep, isEqual, sample, random } from 'lodash';

const BoardClient = ({ board, ctx, moves }) => {
  const isMoveAllowed = pileId => {
    if (!ctx.shouldRoleSelectorMoveNext) return false;
    if (board.piles[pileId] === 0) return false;
    if (pileId === 0 && board.leftRestriction[ctx.currentPlayer]) return false;
    return true;
  }

  return (
    <section className="p-2 shrink-0 grow basis-2/3">
      <div className="flex flex-wrap">
        <span className="grow px-2">
          <button
            className="cta-button"
            onClick = {() => moves.removeStone(board, 0)}
            disabled={!isMoveAllowed(0)}
          >
            Bal: {board.piles[0]}
          </button>
        </span>
        <span className='grow px-2'>
          <button
            className="cta-button"
            onClick = {() => moves.removeStone(board, 1)}
            disabled={!isMoveAllowed(1)}
          >
            Jobb: {board.piles[1]}
          </button>
        </span>
      </div>
    </section>
  )
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

const rule = <>
  Két kupacban kavicsok vannak elhelyezve, a bal oldaliban <i>b</i>, a jobb
  oldaliban <i>j</i> darab. A két játékos felváltva
  lép, és minden lépés során egy kavicsot kell elvenniük valamelyik kupacból.
  Egy játékos azonban nem vehet el két egymást követő lépésben a bal oldali
  kupacból. Az veszít, aki nem tud lépni.
</>;

const getPlayerStepDescription = () =>
  'Kattints a kupacra ahonnan el szeretnél venni egy kavicsot.';

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
  title: 'Kavicsgyűjtés egyesével',
  BoardClient,
  getPlayerStepDescription,
  generateStartBoard,
  aiBotStrategy,
  moves
});
