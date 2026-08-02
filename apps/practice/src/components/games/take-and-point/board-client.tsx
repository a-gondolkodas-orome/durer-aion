import { useEffect, useState } from 'react';
import { range } from 'lodash';
import { useTranslation } from '../../../language';
import { GameBoard, type BoardClientProps } from '../../strategy-game-factory';
import { type Board, requiredPointCount } from './helpers';

const Chips = ({ count, removeCount = 0 }: { count: number; removeCount?: number }) => (
  // rotate(180deg) makes the heap fill from the bottom up, leaving the
  // incomplete row on top so it reads as a pile resting on the ground.
  <div
    className="flex flex-wrap justify-center content-start gap-1.5 w-full min-h-24"
    style={{ transform: 'rotate(180deg)' }}
  >
    {range(count).map(c => {
      // The top `removeCount` stones (highest indices in the flipped container)
      // are the ones marked for removal.
      const removed = c >= count - removeCount;
      return (
        <span
          key={c}
          className={`w-4 h-4 sm:w-6 sm:h-6 rounded-full rotate-180
            ${removed ? 'bg-slate-500 dark:bg-slate-400' : 'bg-amber-500'}`}
        />
      );
    })}
  </div>
);

const Stepper = ({ label, disabled, onClick, children }: {
  label: string; disabled: boolean; onClick: () => void; children: string;
}) => (
  <button
    disabled={disabled}
    onClick={onClick}
    aria-label={label}
    className="w-8 h-8 rounded-full border-2 border-slate-400 bg-surface-elevated
      text-lg font-bold leading-none enabled:hocus:border-blue-400 disabled:opacity-30"
  >
    {children}
  </button>
);

const pileClass = (highlighted: boolean, pointed: boolean, empty: boolean) => `
  w-20 sm:w-28 rounded-lg border-2 p-2 flex flex-col items-center gap-2
  ${highlighted
    ? 'border-blue-500 bg-blue-100 dark:bg-blue-900'
    : pointed
      ? 'border-amber-500 bg-amber-100 dark:bg-amber-900'
      : 'border-slate-400 bg-surface-elevated'}
  ${empty ? 'opacity-40' : ''}
`;

export const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();
  const { piles, pointed } = board;
  const stage: 'point' | 'remove' = pointed === null ? 'point' : 'remove';

  const [selectedForPoint, setSelectedForPoint] = useState<number[]>([]);
  const [removal, setRemoval] = useState<{ index: number; amount: number } | null>(null);

  // Reset the in-progress selection whenever the board advances (own or bot move).
  useEffect(() => {
    setSelectedForPoint([]);
    setRemoval(null);
  }, [ctx.moveCount]);

  const canInteract = ctx.isClientMoveAllowed;
  const pointCount = requiredPointCount(piles);
  const pointingReady = moves.pointPiles.isAllowed!(board, selectedForPoint);

  const togglePoint = (i: number) => {
    if (!canInteract || stage !== 'point' || piles[i] === 0) return;
    setSelectedForPoint(prev => {
      if (prev.includes(i)) return prev.filter(x => x !== i);
      if (prev.length >= pointCount) return prev;
      return [...prev, i];
    });
  };


  const adjustRemoval = (i: number, delta: number) => {
    if (!canInteract || stage !== 'remove') return;
    setRemoval(prev => {
      if (prev && prev.index !== i) return prev; // only one pile may be touched
      const current = prev?.index === i ? prev.amount : 0;
      const next = Math.max(0, Math.min(piles[i], current + delta));
      return next === 0 ? null : { index: i, amount: next };
    });
  };

  const removalReady = removal !== null
    && moves.takeStones.isAllowed!(board, removal.index, removal.amount);

  const submitRemoval = () => {
    if (!removal) return;
    moves.takeStones(board, removal.index, removal.amount);
  };

  return (
    <GameBoard>
      <div className="flex flex-wrap gap-2 sm:gap-6 justify-center items-end">
        {piles.map((count, i) => {
          const isPointed = pointed?.includes(i) ?? false;
          const isSelected = selectedForPoint.includes(i);
          const removeCount = removal?.index === i ? removal.amount : 0;
          const label = t({
            hu: `${i + 1}. kupac, ${count} kavics`,
            en: `Pile ${i + 1}, ${count} stones`
          });

          if (stage === 'point') {
            return (
              <button
                key={i}
                disabled={!canInteract || count === 0}
                onClick={() => togglePoint(i)}
                aria-pressed={isSelected}
                aria-label={label}
                className={`${pileClass(isSelected, false, count === 0)}
                  enabled:hocus:border-blue-400`}
              >
                <Chips count={count} />
                <span className="text-xl font-bold tabular-nums">{count}</span>
              </button>
            );
          }

          return (
            <div
              key={i}
              aria-label={label}
              className={pileClass(removeCount > 0, isPointed, count === 0)}
            >
              <Chips count={count} removeCount={removeCount} />
              <span className="text-xl font-bold tabular-nums">
                {removeCount > 0 ? `−${removeCount} (${count - removeCount})` : count}
              </span>
              {isPointed && (
                <div className="flex items-center gap-2">
                  <Stepper
                    label={t({ hu: `−1 a(z) ${i + 1}. kupacból`, en: `−1 from pile ${i + 1}` })}
                    disabled={!canInteract || removeCount === 0}
                    onClick={() => adjustRemoval(i, -1)}
                  >−</Stepper>
                  <Stepper
                    label={t({ hu: `+1 a(z) ${i + 1}. kupacból`, en: `+1 from pile ${i + 1}` })}
                    // One more stone must itself be a legal take; the second
                    // clause is local UI state (only one pile per turn).
                    disabled={!moves.takeStones.isAllowed!(board, i, removeCount + 1)
                      || (removal !== null && removal.index !== i)}
                    onClick={() => adjustRemoval(i, 1)}
                  >+</Stepper>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {canInteract && stage === 'point' && (
        <button
          disabled={!pointingReady}
          onClick={() => moves.pointPiles(board, selectedForPoint)}
          className="primary-button w-auto mt-4 mx-auto"
        >
          {pointCount === 1
            ? t({ hu: 'Rámutatok az utolsó kupacra', en: 'Point at the last pile' })
            : t({ hu: 'Rámutatok e két kupacra', en: 'Point at these two piles' })}
        </button>
      )}
      {canInteract && stage === 'remove' && (
        <button
          disabled={!removalReady}
          onClick={submitRemoval}
          className="primary-button w-auto mt-4 mx-auto"
        >
          {t({ hu: 'Elveszem a kavicsokat', en: 'Remove the stones' })}
        </button>
      )}
    </GameBoard>
  );
};
