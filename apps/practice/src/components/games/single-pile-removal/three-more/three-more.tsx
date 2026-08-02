import {
  strategyGameFactory, type Ctx, type MoveOutcome, type StrategyArgs
} from '../../../strategy-game-factory';
import { range, random, sample, minBy } from 'lodash';
import { type Board, cap, validateTake, BoardClient, getPlayerStepDescription } from '../pebble-pile';

export { cap };

// You may take up to three more than the other player's last take.
const INCREMENT = 3;
// The opening move is capped at four pebbles.
const OPENING_MAX = 4;

// Memoised minimax: is the position (n stones, max-take m) a win for the mover?
// The winning positions have a period-11 structure (from the opening the second
// player wins exactly when n ≡ 0, 5 or 7 (mod 11)), but the value also depends on
// the cap, so a small memoised search is both correct and simplest. `n` stays
// small, so this is cheap.
const winMemo = new Map<string, boolean>();
export const moverWins = (stones: number, maxTake: number): boolean => {
  if (stones === 0) return false;
  const maxTakeable = Math.min(maxTake, stones);
  const key = `${stones},${maxTakeable}`;
  const cached = winMemo.get(key);
  if (cached !== undefined) return cached;
  let result = false;
  for (let k = 1; k <= maxTakeable; k++) {
    // After taking k the other player faces `stones - k` with a cap of k + 3.
    if (!moverWins(stones - k, k + INCREMENT)) { result = true; break; }
  }
  winMemo.set(key, result);
  return result;
};

// Taking k wins iff it clears the pile, or hands the other player a losing
// position (their new cap becomes k + 3).
export const isWinningTake = (stones: number, k: number): boolean =>
  stones - k === 0 || !moverWins(stones - k, k + INCREMENT);

// The count the optimal bot takes from `board`.
export const chooseSmartTake = (board: Board): number => {
  const { stones } = board;
  const maxTakeable = cap(board);

  // Winning position: play the smallest take that secures the win.
  const winning = range(1, maxTakeable + 1).find(k => isWinningTake(stones, k));
  if (winning !== undefined) return winning;

  // Losing position: every legal take hands the other player a win, so play the
  // "trap" that leaves them the fewest winning replies, breaking ties toward the
  // smaller take (range is ascending and minBy keeps the first minimum) to drag
  // the game out and give the human more chances to err.
  return minBy(range(1, maxTakeable + 1), k => {
    const rem = stones - k;
    const oppCap = Math.min(k + INCREMENT, rem);
    return range(1, oppCap + 1).filter(j => isWinningTake(rem, j)).length;
  })!;
};

const moves = {
  take: {
    validate: validateTake,
    apply: (board: Board, { ctx }: { ctx: Ctx }, count: number): MoveOutcome<Board> => {
      const nextBoard: Board = { stones: board.stones - count, maxTake: count + INCREMENT };
      if (nextBoard.stones === 0) return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      return { nextBoard, isTurnEnd: true };
    }
  }
};

const smartBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  moves.take(board, chooseSmartTake(board));
};

const startBoard = (stones: number): Board => ({ stones, maxTake: OPENING_MAX });

// Balanced starts: from the opening position the second player wins exactly when
// n ≡ 0, 5 or 7 (mod 11); everything else is a first-player win. Picking a
// second-player-win pile ~half the time makes each role win with ~50% probability.
const isSecondPlayerWin = (n: number): boolean => [0, 5, 7].includes(n % 11);
const STONE_RANGE = range(12, 41); // piles large enough to be non-trivial
const secondPlayerWins = STONE_RANGE.filter(isSecondPlayerWin);
const firstPlayerWins = STONE_RANGE.filter(n => !isSecondPlayerWin(n));

const generateStartBoard = (): Board => startBoard(
  random(0, 1) ? sample(secondPlayerWins)! : sample(firstPlayerWins)!
);

const rule = {
  hu: <>
    Ketten felváltva vesznek el egy kupac kavicsból legalább egy kavicsot. A kezdő játékos
    első lépésben legfeljebb 4 kavicsot vehet el. Ezután mindkét játékos maximum hárommal több
    kavicsot vehet el, mint amennyit a másik vett el legutóbb. Az nyer, aki az utolsó
    kavicso(ka)t veszi el.
  </>,
  en: <>
    Two players alternately take at least one pebble from a pile. On the opening move the starting
    player may take at most 4 pebbles. After that, each player may take at most three more pebbles
    than the other player took last time. Whoever takes the last pebble(s) wins.
  </>
};

export const ThreeMore = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  // smart bot: verified as optimal
  variants: [{ botStrategy: smartBotStrategy, generateStartBoard }]
});
