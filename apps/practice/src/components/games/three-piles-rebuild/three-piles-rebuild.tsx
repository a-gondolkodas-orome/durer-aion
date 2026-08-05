import {
  strategyGameFactory, type BoardClientProps, GameBoard, useDeferredMove, useMoveScopedState
} from '../../strategy-game-factory';
import { useTranslation } from '../../../language';
import {
  canSplit,
  generateStartBoard,
  generateTestStartBoard,
  isSplitAllowed,
  moves,
  withOtherPilesDiscarded,
  type Board
} from './gameplay';
import { randomBotStrategy, smartBotStrategy } from './bot-strategy';

// A part is valid if it is a positive integer (the cap keeps arithmetic exact).
const parsePart = (raw: string): number | null => {
  if (!/^\d{1,7}$/.test(raw.trim())) return null;
  const value = parseInt(raw.trim(), 10);
  return value >= 1 ? value : null;
};

type Inputs = { p1: string; p2: string }

// module scope: useMoveScopedState hands this back on every render where the
// stamp is stale, so it has to be one stable reference
const emptyInputs: Inputs = { p1: '', p2: '' };

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();
  const deferMove = useDeferredMove(ctx.moveCount);
  // Move-scoped: the kept pile and the typed parts expire when the board
  // advances (own or bot move).
  const [keepId, setKeepId] = useMoveScopedState<number | null>(ctx.moveCount, null);
  const [inputs, setInputs] = useMoveScopedState<Inputs>(ctx.moveCount, emptyInputs);

  // Between keepPile and splitPile the two discarded piles are 0 — the board is
  // frozen mid-move (own animation beat or the bot's first step).
  const isMidMove = board.filter(v => v === 0).length === 2;
  const activeKeepId = keepId ?? (isMidMove ? board.findIndex(v => v > 0) : null);

  // A rejected click must leave the local selection alone, so this keeps a guard
  // rather than relying on the engine silently ignoring the dispatch.
  const clickPile = (pileId: number) => {
    if (!moves.keepPile.isAllowed(board, pileId)) return;
    setInputs(emptyInputs);
    setKeepId(prev => (prev === pileId ? null : pileId));
  };

  const n = keepId === null ? 0 : board[keepId];
  const p1 = parsePart(inputs.p1);
  const p2 = parsePart(inputs.p2);
  const p3 = p1 !== null && p2 !== null ? n - p1 - p2 : null;
  // The rebuild is judged against the board the keep would leave behind, since
  // both halves of the turn are submitted by this one button.
  const splitValid = keepId !== null && p1 !== null && p2 !== null && p3 !== null
    && isSplitAllowed(withOtherPilesDiscarded(board, keepId), [p1, p2, p3]);

  const submit = () => {
    if (!ctx.isClientMoveAllowed || keepId === null || !splitValid) return;
    const parts = [p1!, p2!, p3!];
    // Step 1: keep the chosen pile (drops the other two). Step 2 (after a beat):
    // split it into the three new piles.
    const { nextBoard } = moves.keepPile(board, keepId);
    setKeepId(null);
    setInputs(emptyInputs);
    deferMove(() => moves.splitPile(nextBoard, parts));
  };

  const caption = (pileId: number): string => {
    if (board[pileId] === 0) return '🗑️';
    if (activeKeepId === pileId) return t({ hu: '✓ megtartod', en: '✓ keep' });
    if (keepId !== null) return '🗑️';
    if (!canSplit(board[pileId])) return t({ hu: 'túl kevés', en: 'too few' });
    return t({ hu: 'kavics', en: 'pieces' });
  };

  return (
    <GameBoard>
      <div className="flex gap-2 sm:gap-3 justify-center">
        {[0, 1, 2].map(pileId => {
          const isKept = activeKeepId === pileId;
          const isDiscarded = !isKept && (board[pileId] === 0 || keepId !== null);
          return (
            <button
              key={pileId}
              disabled={!moves.keepPile.isAllowed(board, pileId)}
              onClick={() => clickPile(pileId)}
              className={`
                flex-1 max-w-32 rounded-lg border-2 p-3 sm:p-4 flex flex-col items-center gap-1
                ${isKept
                  ? 'border-blue-500 bg-blue-100 dark:bg-blue-900'
                  : isDiscarded
                    ? 'border-slate-300 dark:border-slate-700 opacity-50'
                    : 'border-slate-400 bg-surface-elevated enabled:hocus:border-blue-400'}
                disabled:opacity-40
              `}
            >
              <span className="text-3xl sm:text-4xl font-bold tabular-nums">
                {board[pileId] === 0 ? '—' : board[pileId]}
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400">{caption(pileId)}</span>
            </button>
          );
        })}
      </div>

      {ctx.isClientMoveAllowed && keepId !== null && (
        <div className="mt-4 flex flex-col gap-3 bg-surface-elevated rounded-lg p-3 max-w-md">
          <p className="text-sm">
            {t({
              hu: `${n} kavicsból építs három kupacot:`,
              en: `Build three piles from ${n} pebbles:`
            })}
          </p>
          <div className="flex items-end gap-2 flex-wrap">
            {(['p1', 'p2'] as const).map((key, i) => (
              <div key={key} className="flex flex-col gap-1">
                <label htmlFor={`part-${key}`} className="text-xs text-slate-600 dark:text-slate-400">
                  {t({ hu: `${i + 1}. kupac`, en: `Pile ${i + 1}` })}
                </label>
                <input
                  id={`part-${key}`}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={inputs[key]}
                  onChange={e => setInputs(prev => ({ ...prev, [key]: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') submit(); }}
                  className="w-20 px-2 py-1.5 rounded-md border-2 border-slate-400 bg-transparent"
                />
              </div>
            ))}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-600 dark:text-slate-400">
                {t({ hu: '3. kupac', en: 'Pile 3' })}
              </span>
              <span
                className={`w-20 px-2 py-1.5 rounded-md border-2 border-dashed text-center tabular-nums
                  ${splitValid ? 'border-slate-400' : 'border-red-400 text-red-500'}`}
              >
                {p3 === null ? '?' : p3}
              </span>
            </div>
            <button
              disabled={!splitValid}
              onClick={submit}
              className="rounded-md border-2 px-4 py-1.5 font-bold self-end
                enabled:hocus:bg-blue-100 dark:enabled:hocus:bg-blue-900
                enabled:hocus:border-blue-300 disabled:opacity-50"
            >
              {t({ hu: 'Újraosztom', en: 'Split' })}
            </button>
          </div>
          {p1 !== null && p2 !== null && p3 !== null && p3 < 1 && (
            <p className="text-sm text-red-500">
              {t({
                hu: 'Túl sok kavicsot osztottál ki — mindhárom kupacba legalább 1 kell.',
                en: 'Too many pebbles used — each of the three piles needs at least 1.'
              })}
            </p>
          )}
        </div>
      )}
    </GameBoard>
  );
};

// "Keep, then split" is one decision, so the turn is named as a whole (mirrors
// the pile-splitting games).
const getPlayerStepDescription = () => ({
  hu: 'Válaszd ki, melyik kupacot tartod meg (a másik kettőt eldobod), majd oszd három új kupacra.',
  en: 'Choose which pile to keep (the other two are discarded), then split it into three new piles.'
});

const rule = {
  hu: <>
    A játék kezdetén az asztalon van három kupac, mindegyikben néhány kaviccsal.
    A soron következő játékos egy lépésében eldob két kupacot, és a megmaradt kupacban lévő
    kavicsokból újra három kupacot csinál. Az veszít, aki már nem tud három kupacot építeni a
    megmaradt kavicsokból (vagyis a kiválasztott kupacban kevesebb mint három kavics maradt).
  </>,
  en: <>
    At the start there are three piles on the table, each with some pebbles. On their turn, the
    current player discards two of the piles and rebuilds three new piles from the pebbles of the
    remaining one. You lose if you can no longer build three piles from the remaining pebbles (i.e.
    the chosen pile has fewer than three pebbles).
  </>
};

export const ThreePilesRebuild = strategyGameFactory({
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
    // smart bot: verified as optimal
    {
      botStrategy: smartBotStrategy,
      generateStartBoard,
      label: { hu: 'Teljes', en: 'Full' },
      isDefault: true
    }
  ]
});
