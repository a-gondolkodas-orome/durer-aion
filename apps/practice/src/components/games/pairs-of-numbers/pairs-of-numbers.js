import React from 'react';
import { strategyGameFactory } from '../strategy-game';
import { random } from 'lodash';
import { gameList } from '../gameList';

const BoardClient = ({ board, ctx, moves }) => {
  return(
    <section className="p-2 shrink-0 grow basis-2/3">
      <p className='w-full text-8xl font-bold text-center'>
        <code>({board[0]},{board[1]})</code>
      </p>
      <div className="flex flex-wrap">
        <span className="grow px-2">
          <button
            className='cta-button'
            disabled={!ctx.shouldRoleSelectorMoveNext}
            onClick={() => moves.add1(board)}
          >
            Növelek {ctx.shouldRoleSelectorMoveNext && <>
              (→<code className="text-md">({board[0]},{board[1] + 1})</code>)
            </>}
          </button>
        </span>
        <span className='grow px-2'>
          <button
            className="cta-button"
            disabled={!ctx.shouldRoleSelectorMoveNext}
            onClick={() => moves.subtract(board)}
          >
            Kivonok {ctx.shouldRoleSelectorMoveNext && <>
              (→<code className="text-md">({board[0] - board[1]},{board[1]})</code>)
            </>}
          </button>
        </span>
      </div>
    </section>
  );
};

const moves = {
  add1: (board, { events }) => {
    events.endTurn();
    return { nextBoard: [board[0], board[1] + 1] }
  },
  subtract: (board, { events }) => {
    events.endTurn();
    if (board[0] - board[1] <= 0) {
      events.endGame();
    }
    return { nextBoard: [board[0] - board[1], board[1]] };
  }
};

const aiBotStrategy = ({ board, moves }) => {
  const [a, b] = board;
  if (a <= b) {
    moves.subtract(board);
    return;
  }
  if (a <= 2 * b) {
    moves.add1(board);
    return;
  }

  if (a % 2 === 0 && b % 2 === 0) {
    moves.add1(board);
    return;
  }
  if (a % 2 === 1 && b % 2 === 1) {
    moves.subtract(board);
    return;
  }
  if (a % 2 === 1 & b % 2 === 0) {
    moves.subtract(board);
    return;
  }

  moves.add1(board);
};

const rule = <>
  Adott egy pozitív egészekből álló <code>(n, k)</code> rendezett számpár.
  Két játékos felváltva lép, az <code>(a, b)</code> számpár
  helyére egy lépésben kerülhet vagy az <code>(a, b + 1)</code>, vagy az <code>(a − b, b)</code> számpár.
Az nyer, aki először ír fel olyan számpárt, amelyben nem mindkét szám pozitív.
</>;

const generateStartBoard = () => {
  if (random(0, 2) === 0) {
    const b = random(8, 15);
    const a = b + random(1, b);
    return [a, b];
  }
  if (random(0, 1) === 0) {
    const r = random(0, 2);
    if (r === 0) {
      const b = random(5, 9) * 2 + 1;
      const a = b * 2 + random(0, 5) * 2;
      return [a, b];
    } else if (r === 1) {
      const b = random(5, 9) * 2 + 1;
      const a = b * 2 + random(0, 5) * 2 + 1;
      return [a, b];
    } else if (r === 2) {
      const b = random(5, 9) * 2;
      const a = b * 2 + random(0, 5) * 2;
      return [a, b];
    }
  } else {
    const b = random(5, 9) * 2;
    const a = b * (2 + random(0, 3)) + random(0, Math.floor((b - 1)/2)) * 2 + 1;
    return [a, b];
  }

  return [random(15, 25), random(10, 15)];
}

export const PairsOfNumbers = strategyGameFactory({
  rule,
  metadata: gameList.PairsOfNumbers,
  BoardClient,
  getPlayerStepDescription: () => 'Növeld a második számot eggyel vagy vond ki az elsőből.',
  generateStartBoard,
  aiBotStrategy,
  moves
});
