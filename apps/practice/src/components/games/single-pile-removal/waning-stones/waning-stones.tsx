import {
  strategyGameFactory, type Ctx, type MoveOutcome, type BotStrategy
} from '../../../strategy-game-factory';
import { range, random, sample, minBy } from 'lodash';
import { type Board, cap, validateTake, BoardClient, getPlayerStepDescription } from '../pebble-pile';

export { cap };

// t(n): the largest power of 2 dividing n (its lowest set bit).
export const lowestPow2 = (n: number): number => n & -n;

// A position (n stones, m max-take) is losing for the mover exactly when m < t(n).
// So taking k wins iff it clears the pile, or hands the opponent such a losing
// position (their new cap k is below the lowest set bit of what remains).
export const isWinningTake = (stones: number, k: number): boolean =>
  stones - k === 0 || k < lowestPow2(stones - k);

// The count the optimal bot takes from `board`.
export const chooseSmartTake = (board: Board): number => {
  const { stones } = board;
  const maxTakeable = cap(board);

  const winningTake = lowestPow2(stones);
  if (winningTake <= maxTakeable) return winningTake;

  // Losing position: every legal take hands the opponent a win, so play the
  // "trap" that leaves them the fewest winning replies, breaking ties toward the
  // smaller take (range is ascending and minBy keeps the first minimum) to drag
  // the game out and give the human more chances to err.
  return minBy(range(1, maxTakeable + 1), k => {
    const rem = stones - k;
    const oppCap = Math.min(k, rem);
    return range(1, oppCap + 1).filter(j => isWinningTake(rem, j)).length;
  })!;
};

export const moves = {
  take: {
    validate: validateTake,
    apply: (board: Board, { ctx }: { ctx: Ctx }, count: number): MoveOutcome<Board> => {
      const nextBoard: Board = { stones: board.stones - count, maxTake: count };
      if (nextBoard.stones === 0) return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      return { nextBoard, isTurnEnd: true };
    }
  }
};

type Bot = BotStrategy<Board, keyof typeof moves>

const smartBotStrategy: Bot = ({ board }) =>
  ({ move: 'take', args: [chooseSmartTake(board)] });

// Test bot: takes the whole pile if that wins immediately, otherwise a random
// legal amount.
const randomBotStrategy: Bot = ({ board }) => {
  if (board.stones <= board.maxTake) {
    return { move: 'take', args: [board.stones] };
  }
  return { move: 'take', args: [random(1, cap(board))] };
};

const startBoard = (stones: number): Board => ({ stones, maxTake: Math.floor(stones / 2) });

// Balanced starts: a power of 2 is a second-player win, everything else a
// first-player win, so picking a power of 2 ~half the time makes each role win
// with ~50% probability.
const generateStartBoard = (): Board => startBoard(
  random(0, 1)
    ? sample([8, 16, 32, 64])!
    : sample(range(8, 66).filter(n => (n & (n - 1)) !== 0))!
);

const generateTestStartBoard = (): Board => startBoard(sample([6, 8, 9, 10, 12])!);

const rule = {
  hu: <>
    Ketten felváltva vesznek el egy kupac kavicsból legalább egy kavicsot. A kezdő első
    lépésben legfeljebb a kezdeti kavicsok felét veheti el. Ezután mindkét játékos maximum
    annyit vehet el, mint amennyit a másik vett el legutóbb. Az nyer, aki az utolsó
    kavicso(ka)t veszi el.
  </>,
  en: <>
    Two players alternately take at least one pebble from a pile. On the opening move the starting
    player may take at most half of the initial pebbles. After that, each player may take at most as
    many as the other took last time. Whoever takes the last pebble(s) wins.
  </>
};

export const WaningStones = strategyGameFactory({
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
