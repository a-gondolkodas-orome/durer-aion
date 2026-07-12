import { useState } from 'react';
import {
  strategyGameFactory, type Events, type StrategyArgs, type BoardClientProps, GameBoard
} from '../../../game-factory';
import { range, random, sample, minBy } from 'lodash';
import { useTranslation } from '../../../language';

// `stones` is the number of pebbles left in the pile. `maxTake` is the most a
// player may take this turn: on the opening move it is ⌊stones/2⌋ (baked into the
// start board); after every move it becomes the amount just taken.
type Board = { stones: number; maxTake: number }

// t(n): the largest power of 2 dividing n (its lowest set bit).
export const lowestPow2 = (n: number): number => n & -n;

// The most a player may legally take this turn.
export const cap = (board: Board): number => Math.min(board.maxTake, board.stones);

// A position (n stones, m max-take) is losing for the mover exactly when m < t(n).
// So taking k wins iff it clears the pile, or hands the opponent such a losing
// position (their new cap k is below the lowest set bit of what remains).
export const isWinningTake = (stones: number, k: number): boolean =>
  stones - k === 0 || k < lowestPow2(stones - k);

// The count the optimal bot takes from `board`.
export const chooseSmartTake = (board: Board): number => {
  const { stones } = board;
  const c = cap(board);

  const winningTake = lowestPow2(stones);
  if (winningTake <= c) return winningTake;

  // Losing position: every legal take hands the opponent a win, so play the
  // "trap" that leaves them the fewest winning replies, breaking ties toward the
  // smaller take (range is ascending and minBy keeps the first minimum) to drag
  // the game out and give the human more chances to err.
  return minBy(range(1, c + 1), k => {
    const rem = stones - k;
    const oppCap = Math.min(k, rem);
    return range(1, oppCap + 1).filter(j => isWinningTake(rem, j)).length;
  })!;
};

const StonePile = ({ board, disabled, onTake, moveCount }: {
  board: Board; disabled: boolean; onTake: (count: number) => void; moveCount: number
}) => {
  const [hovered, setHovered] = useState<{ count: number; moveCount: number } | null>(null);
  const previewCount = hovered?.moveCount === moveCount ? hovered.count : 0;
  const c = cap(board);

  return (
    // rotate(180deg) makes the pile fill from the bottom (incomplete row on top)
    // while keeping left-to-right reading order, so pebble "1" is the top-left of
    // the pile and the count grows down and to the right. Each pebble re-rotates
    // 180° so its number stays upright. Pebbles are taken from the top, so DOM
    // index i corresponds to taking stones - i.
    <div className="flex flex-wrap justify-center gap-1.5 p-2" style={{ transform: 'rotate(180deg)' }}>
      {range(board.stones).map(i => {
        const takeCount = board.stones - i; // clicking a pebble takes it and everything above
        const takeable = takeCount <= c;
        // Only selectable pebbles drive the hover preview. Don't rely on the
        // `disabled` attribute to suppress this — some browsers (e.g. Safari)
        // still fire pointer events on disabled buttons.
        const canSelect = !disabled && takeable;
        return (
          <button
            key={i}
            disabled={disabled || !takeable}
            onClick={() => onTake(takeCount)}
            onPointerEnter={() => canSelect && setHovered({ count: takeCount, moveCount })}
            onPointerMove={() => canSelect && setHovered({ count: takeCount, moveCount })}
            onPointerLeave={() => setHovered(null)}
            onFocus={() => canSelect && setHovered({ count: takeCount, moveCount })}
            onBlur={() => setHovered(null)}
            aria-label={`${takeCount}`}
            className={`w-[11%] sm:w-[8%] aspect-square rounded-full bg-stone-500 shadow-md shadow-stone-700
              flex items-center justify-center text-white font-semibold text-xs sm:text-sm
              transition-opacity
              ${canSelect && takeCount <= previewCount ? 'opacity-30' : ''}`}
            style={{ transform: 'rotate(180deg)' }}
          >
            {/* Active pebbles show how many would be removed by clicking them. */}
            {canSelect && <span>{takeCount}</span>}
          </button>
        );
      })}
    </div>
  );
};

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();
  return (
    <GameBoard>
      <p className="text-center text-2xl font-bold mb-2">
        {t({ hu: 'Kavicsok', en: 'Pebbles' })}: {board.stones}
      </p>
      <StonePile
        board={board}
        disabled={!ctx.isClientMoveAllowed}
        onTake={count => moves.take(board, count)}
        moveCount={ctx.moveCount}
      />
    </GameBoard>
  );
};

const moves = {
  take: (board: Board, { events }: { events: Events }, count: number) => {
    const nextBoard: Board = { stones: board.stones - count, maxTake: count };
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

const getPlayerStepDescription = ({ board }: { board: Board }) => ({
  hu: `Kattints egy kavicsra: legfeljebb ${cap(board)} kavicsot vehetsz el.`,
  en: `Click a pebble: you may take at most ${cap(board)} pebble(s).`
});

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
