import { strategyGameFactory, type BotStrategy } from '../../../strategy-game-factory';
import { range, minBy } from 'lodash';
import { BoardClient, getPlayerStepDescription } from '../pebble-pile';
import { type Board, cap } from '../gameplay';
import { generateStartBoard, moves, INCREMENT, type Moves } from './gameplay';

export { cap };

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

type Bot = BotStrategy<Board, Moves>

const smartBotStrategy: Bot = ({ board }) =>
  ({ move: 'take', args: [chooseSmartTake(board)] });

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
