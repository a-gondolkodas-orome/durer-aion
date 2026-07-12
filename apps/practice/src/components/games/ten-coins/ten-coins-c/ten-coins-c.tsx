import { uniq, sample, random, range } from 'lodash';
import {
  strategyGameFactory,
  type Events, type StrategyArgs, type BoardClientProps,
  GameBoard
} from '../../../game-factory';
import { useTranslation } from '../../../language';

// The board is the multiset of coin values (each in 1..4). Only which distinct
// values are present matters for the game logic; the counts are pure flavour.
type Board = number[]

const totalCoins = 10;
const values = [1, 2, 3, 4];

// --- Exact solver over the (at most 15) non-empty subsets of {1,2,3,4} ---------
// A move picks a present value K and turns *all* K-coins into some L < K, so the
// set of distinct values goes from S to (S \ {K}) ∪ {L}. You win when only one
// distinct value remains after your move.

type Move = { k: number, l: number, resultSet: number[] }

const distinctValues = (board: Board): number[] => uniq(board).sort((a, b) => a - b);

const movesFromSet = (set: number[]): Move[] => {
  const result: Move[] = [];
  for (const k of set) {
    for (let l = 1; l < k; l++) {
      const resultSet = uniq([...set.filter(v => v !== k), l]).sort((a, b) => a - b);
      result.push({ k, l, resultSet });
    }
  }
  return result;
};

const isWinningMove = (move: Move): boolean =>
  // reaching a single value wins immediately; otherwise a move is winning when it
  // leaves the opponent in a losing position.
  move.resultSet.length === 1 || !playerToMoveWins(move.resultSet);

const winMemo: Record<string, boolean> = {};
const playerToMoveWins = (set: number[]): boolean => {
  const key = set.join(',');
  if (key in winMemo) return winMemo[key];
  // Guard against self-reference before the result is memoised (the recursion is
  // acyclic since every move strictly decreases the coin values, but be safe).
  winMemo[key] = false;
  const wins = movesFromSet(set).some(isWinningMove);
  return (winMemo[key] = wins);
};

// The single losing position is {1,2,3}: every move from it hands the opponent a
// two-value board, which they win instantly. Everything else is won by driving
// the position to {1,2,3} (or merging to a single value when two remain).

const BoardClient = ({ board, ctx, events, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();
  const selectedValue = ctx.turnState as number | null;
  const presentValues = values.filter(v => board.includes(v));

  // Value-1 coins can't be selected: there is no smaller value to change them to.
  const isSelectable = (v: number) => v > 1;

  const selectValue = (v: number) => {
    if (!ctx.isClientMoveAllowed || !isSelectable(v)) return;
    events.setTurnState(selectedValue === v ? null : v);
  };

  const chooseTarget = (l: number) => {
    if (!ctx.isClientMoveAllowed || selectedValue === null) return;
    moves.convert(board, selectedValue, l);
    events.setTurnState(null);
  };

  return (
    <GameBoard>
      <div className="flex flex-wrap items-end gap-3">
        {presentValues.map(v => {
          const count = board.filter(c => c === v).length;
          const isSelected = selectedValue === v;
          return (
            <button
              key={v}
              disabled={!ctx.isClientMoveAllowed || !isSelectable(v)}
              onClick={() => selectValue(v)}
              aria-pressed={isSelected}
              aria-label={t({
                hu: `${count} darab ${v} értékű érme`,
                en: `${count} coins of value ${v}`
              })}
              className={`
                flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors
                ${isSelected
                  ? 'border-blue-500 bg-blue-100 dark:bg-blue-900'
                  : 'border-transparent enabled:hocus:bg-slate-100 dark:enabled:hocus:bg-slate-700'}
                disabled:cursor-default
              `}
            >
              {/* rotate(180deg) fills the pile from the bottom, leaving the
                  incomplete row on top; each coin re-rotates so it stays upright. */}
              <div className="flex flex-wrap gap-1 justify-center max-w-36"
                style={{ transform: 'rotate(180deg)' }}
              >
                {range(count).map(i => (
                  <div key={i} style={{ transform: 'rotate(180deg)' }}>
                    <Coin value={v} />
                  </div>
                ))}
              </div>
              <span className="text-sm font-semibold">
                {t({ hu: `${count} db`, en: `×${count}` })}
              </span>
            </button>
          );
        })}
      </div>

      {selectedValue !== null && (
        <div className="mt-6 pt-4 border-t flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold">
            {t({ hu: 'Legyen belőlük:', en: 'Change them to:' })}
          </span>
          {range(1, selectedValue).map(l => (
            <button
              key={l}
              disabled={!ctx.isClientMoveAllowed}
              onClick={() => chooseTarget(l)}
              aria-label={t({ hu: `${l} értékű érme`, en: `value ${l} coin` })}
              className="rounded-full transition-transform enabled:hocus:scale-110
                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              <Coin value={l} />
            </button>
          ))}
        </div>
      )}
    </GameBoard>
  );
};

const coinColors: Record<number, string> = {
  1: 'bg-slate-200 border-slate-500 text-slate-800 dark:bg-slate-600 dark:border-slate-300 dark:text-slate-100',
  2: 'bg-blue-200 border-blue-600 text-blue-900 dark:bg-blue-800 dark:border-blue-300 dark:text-blue-100',
  3: 'bg-green-200 border-green-600 text-green-900 dark:bg-green-800 dark:border-green-300 dark:text-green-100',
  4: 'bg-red-200 border-red-600 text-red-900 dark:bg-red-800 dark:border-red-300 dark:text-red-100'
};

const Coin = ({ value }: { value: number }) => (
  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center
    text-lg font-bold ${coinColors[value]}`}
  >
    {value}
  </div>
);

const moves = {
  convert: (board: Board, { events }: { events: Events }, k, l) => {
    const nextBoard = board.map(v => (v === k ? l : v)).sort((a, b) => a - b);
    if (uniq(nextBoard).length === 1) {
      events.endGame(); // whoever equalises the coins wins → current player
    } else {
      events.endTurn();
    }
    return { nextBoard };
  }
};

// Smart bot: play the winning move when one exists (drive towards {1,2,3}, or
// merge to a single value). In a losing position, make the reply that leaves the
// opponent with the most ways to blunder.
const smartBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  const candidateMoves = movesFromSet(distinctValues(board));

  const winningMoves = candidateMoves.filter(isWinningMove);
  if (winningMoves.length > 0) {
    const move = sample(winningMoves)!;
    moves.convert(board, move.k, move.l);
    return;
  }

  const blunderRoom = (move: Move) => {
    const opponentMoves = movesFromSet(move.resultSet);
    return opponentMoves.filter(m => !isWinningMove(m)).length;
  };
  const rooms = candidateMoves.map(blunderRoom);
  const maxRoom = Math.max(...rooms);
  const bestMoves = candidateMoves.filter((_, i) => rooms[i] === maxRoom);
  const move = sample(bestMoves)!;
  moves.convert(board, move.k, move.l);
};

// Test bot: play a random legal move, but grab an immediate win when available.
const randomBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  const candidateMoves = movesFromSet(distinctValues(board));
  const winningNow = candidateMoves.filter(m => m.resultSet.length === 1);
  const move = sample(winningNow.length > 0 ? winningNow : candidateMoves)!;
  moves.convert(board, move.k, move.l);
};

// Distribute `total` coins among `parts` values, each value getting at least one.
const randomCounts = (total: number, parts: number): number[] => {
  const counts = Array(parts).fill(1);
  for (let i = 0; i < total - parts; i++) counts[random(0, parts - 1)]++;
  return counts;
};

// Mix of starts: ~half are {1,2,3} (second player wins), ~half are a first-player
// win, so choosing the right role genuinely matters.
const generateStartBoard = (): Board => {
  const set = random(0, 1) === 0
    ? [1, 2, 3]
    : sample([[1, 2, 4], [1, 3, 4], [2, 3, 4], [1, 2, 3, 4]])!;
  const counts = randomCounts(totalCoins, set.length);
  return set.flatMap((v, i) => Array(counts[i]).fill(v));
};

const getPlayerStepDescription = ({ ctx }) => {
  if (ctx.turnState !== null) {
    return {
      hu: `Válaszd ki, mi legyen a(z) ${ctx.turnState} értékű érmék új (kisebb) értéke.`,
      en: `Choose the new (smaller) value for the coins worth ${ctx.turnState}.`
    };
  }
  return {
    hu: 'Válaszd ki, melyik értékű érméket változtatod meg (egyszerre az összeset).',
    en: 'Choose which coin value to change (all of them at once).'
  };
};

const rule = {
  hu: <>
    Kezdetben van 10 érme az asztalon, melyek értékei 1 és 4 közé eső egészek lehetnek.
    A két játékos felváltva lép. A soron lévő játékos kiválaszt egy K értéket, amire igaz,
    hogy van az asztalon K értékű érme, és az összes K értékű érmét átváltoztatja valamilyen
    kisebb L értékűre (mindet ugyanarra az L értékre, ahol az L érték 1 és K−1 közötti).
    Az nyer, akinek a lépése után minden érme azonos értékű lesz. A kezdőállás ismeretében
    Te döntheted el, hogy a kezdő vagy a második játékos bőrébe szeretnél-e bújni.
  </>,
  en: <>
    There are 10 coins on the table to start, each with an integer value between 1 and 4.
    The two players move alternately. On their turn the current player chooses a value K such
    that at least one coin of value K is on the table, and turns all coins of value K into some
    smaller value L (all to the same L, where L is between 1 and K−1). Whoever makes all coins
    equal in value after their move wins. Knowing the starting position, you may decide whether
    to play as the first or the second player.
  </>
};

export const TenCoins = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
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
