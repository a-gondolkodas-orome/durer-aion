import { useState } from 'react';
import {
  strategyGameFactory, type Events, type StrategyArgs, type BoardClientProps, GameBoard
} from '../../game-factory';
import { range, random, sample, minBy } from 'lodash';
import { useTranslation } from '../../language';

// `stones` is the number of pebbles left in the pile. `maxTake` is the most a
// player may take this turn: on the opening move it is stones − 1 (you may not
// clear the pile in one go), and after a move of k it becomes 2k − 1 (strictly
// less than twice the previous take).
type Board = { stones: number; maxTake: number }

// t(n): the largest power of 2 dividing n (its lowest set bit).
export const lowestPow2 = (n: number): number => n & -n;

// The most a player may legally take this turn.
export const cap = (board: Board): number => Math.min(board.maxTake, board.stones);

// Taking k next hands the opponent the position (stones − k, maxTake 2k − 1).
// A position (n, m) is losing for the mover exactly when m < t(n). So taking k
// wins iff it clears the pile, or leaves the opponent with 2k − 1 below the
// lowest set bit of what remains.
export const isWinningTake = (stones: number, k: number): boolean =>
  stones - k === 0 || 2 * k - 1 < lowestPow2(stones - k);

// The count the optimal bot takes from `board`.
export const chooseSmartTake = (board: Board): number => {
  const { stones } = board;
  const c = cap(board);

  // If the whole pile is within reach, clear it and win now rather than dragging
  // the game out with a smaller "textbook" lowest-bit take.
  if (stones <= c) return stones;

  // Otherwise the winning move (when one exists) removes the lowest power-of-2
  // block, handing the opponent a losing position.
  const winningTake = lowestPow2(stones);
  if (winningTake <= c) return winningTake;

  // Losing position: every legal take loses to optimal play, so play a "trap"
  // that makes the opponent actually earn the win.
  //  1. Never hand them a one-move kill: exclude takes that leave a pile they
  //     could clear next turn (their cap 2k − 1 would reach the whole remainder).
  //  2. Among the rest, leave the position whose winning reply is hardest to
  //     find (fewest winning replies), breaking ties toward the *larger* take so
  //     the game keeps some substance instead of collapsing straight to 1-takes.
  const takes = range(1, c + 1);
  const safe = takes.filter(k => stones - k > 2 * k - 1); // opponent cannot clear
  const pool = safe.length > 0 ? safe : takes; // forced endgame: no safe take exists
  return minBy(pool, k => {
    const rem = stones - k;
    const oppCap = Math.min(2 * k - 1, rem);
    const winningReplies = range(1, oppCap + 1).filter(j => isWinningTake(rem, j)).length;
    return winningReplies * 10000 - k; // primary: fewer winning replies; tie-break: larger take
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

const getPlayerStepDescription = ({ board }: { board: Board }) => ({
  hu: `Kattints egy kavicsra: legfeljebb ${cap(board)} kavicsot vehetsz el.`,
  en: `Click a pebble: you may take at most ${cap(board)} pebble(s).`
});

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
      label: { hu: 'Teszt 🤖', en: 'Test 🤖' }
    },
    {
      // smart bot: verified as optimal
      botStrategy: smartBotStrategy,
      generateStartBoard,
      label: { hu: 'Okos 🤖', en: 'Smart 🤖' },
      isDefault: true
    }
  ]
});
