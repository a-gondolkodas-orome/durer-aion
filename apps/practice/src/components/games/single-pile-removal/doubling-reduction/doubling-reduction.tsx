import { strategyGameFactory, type Events, type StrategyArgs } from '../../../strategy-game-factory';
import { range, random, sample, minBy } from 'lodash';
import { type Board, cap, BoardClient, getPlayerStepDescription } from '../pebble-pile';

export { cap };

// t(n): the largest power of 2 dividing n (its lowest set bit).
export const lowestPow2 = (n: number): number => n & -n;

// Taking k next hands the opponent the position (stones − k, maxTake 2k − 1).
// A position (n, m) is losing for the mover exactly when m < t(n). So taking k
// wins iff it clears the pile, or leaves the opponent with 2k − 1 below the
// lowest set bit of what remains.
export const isWinningTake = (stones: number, k: number): boolean =>
  stones - k === 0 || 2 * k - 1 < lowestPow2(stones - k);

// The count the optimal bot takes from `board`.
export const chooseSmartTake = (board: Board): number => {
  const { stones } = board;
  const maxTakeable = cap(board);

  // If the whole pile is within reach, clear it and win now rather than dragging
  // the game out with a smaller "textbook" lowest-bit take.
  if (stones <= maxTakeable) return stones;

  // Otherwise the winning move (when one exists) removes the lowest power-of-2
  // block, handing the opponent a losing position.
  const winningTake = lowestPow2(stones);
  if (winningTake <= maxTakeable) return winningTake;

  // Losing position: every legal take loses to optimal play, so play a "trap"
  // that makes the opponent actually earn the win.
  //  1. Never hand them a one-move kill: exclude takes that leave a pile they
  //     could clear next turn (their cap 2k − 1 would reach the whole remainder).
  //  2. Among the rest, leave the position whose winning reply is hardest to
  //     find (fewest winning replies), breaking ties toward the *larger* take so
  //     the game keeps some substance instead of collapsing straight to 1-takes.
  const takes = range(1, maxTakeable + 1);
  const safe = takes.filter(k => stones - k > 2 * k - 1); // opponent cannot clear
  const pool = safe.length > 0 ? safe : takes; // forced endgame: no safe take exists
  return minBy(pool, k => {
    const rem = stones - k;
    const oppCap = Math.min(2 * k - 1, rem);
    const winningReplies = range(1, oppCap + 1).filter(j => isWinningTake(rem, j)).length;
    return winningReplies * 10000 - k; // primary: fewer winning replies; tie-break: larger take
  })!;
};

const moves = {
  take: (board: Board, { events }: { events: Events }, count: number) => {
    // Next player may take strictly less than twice this take, i.e. up to 2·count − 1.
    const nextBoard: Board = { stones: board.stones - count, maxTake: 2 * count - 1 };
    events.endTurn();
    if (nextBoard.stones === 0) events.endGame(); // mover took the last stone(s) → wins
    return { nextBoard };
  }
};

const smartBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  moves.take(board, chooseSmartTake(board));
};

// Test bot: takes the whole pile if that wins immediately, otherwise a random
// legal amount.
const randomBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  if (board.stones <= board.maxTake) {
    moves.take(board, board.stones);
    return;
  }
  moves.take(board, random(1, cap(board)));
};

const startBoard = (stones: number): Board => ({ stones, maxTake: stones - 1 });

// Balanced starts: a power of 2 is a second-player win, everything else a
// first-player win, so picking a power of 2 ~half the time makes each role win
// with ~50% probability. The specific piles are hand-picked so optimal play
// stays lively: their winning opening removes a sizeable power-of-2 block rather
// than a single pebble (an odd pile would force a long run of forced 1-takes,
// since taking 1 caps the next player at 1 too).
const generateStartBoard = (): Board => startBoard(
  random(0, 1)
    ? sample([16, 32])!
    : sample([20, 24, 40, 48])!
);

const generateTestStartBoard = (): Board => startBoard(sample([8, 12, 16, 20])!);

const rule = {
  hu: <>
    Két játékos felváltva vesz el néhány kavicsot egy kupacból. Minden lépésben legalább egy
    kavicsot el kell venni. Az veszít, aki nem tud szabályosan lépni. A kezdő játékos az első
    lépésben legfeljebb eggyel kevesebb kavicsot vehet el, mint amennyi a kupacban van; ezután
    mindenki szigorúan kevesebbet vehet el, mint kétszer annyit, mint amennyit a másik játékos az
    előző lépésben elvett.
  </>,
  en: <>
    Two players alternately take some pebbles from a pile. At least one pebble must be taken each
    turn, and whoever cannot move loses. On the opening move the starting player may take at most one
    fewer than the whole pile; after that, each player may take strictly fewer than twice as many as
    the other player took on the previous move.
  </>
};

export const DoublingReduction = strategyGameFactory({
  presentation: {
    rule,
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
    {
      // smart bot: verified as optimal
      botStrategy: smartBotStrategy,
      generateStartBoard,
      label: { hu: 'Teljes', en: 'Full' },
      isDefault: true
    }
  ]
});
