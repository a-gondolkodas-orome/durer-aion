import { useEffect, useState } from 'react';
import { range } from 'lodash';
import { useTranslation } from '../../../language';
import { GameBoard, type BoardClientProps } from '../../strategy-game-factory';
import { type Board, boundaryEdgesToPlace, currentWindowSize, legalMoves } from './helpers';

const Matchstick = ({ ghost = false }: { ghost?: boolean }) => (
  <div
    className={`h-full flex flex-col items-center justify-center gap-px ${ghost ? 'opacity-40' : ''}`}
    aria-hidden="true"
  >
    <span className="w-0.5 sm:w-1 h-1 sm:h-1.5 rounded-full bg-red-500 shrink-0" />
    <span className="w-0.5 sm:w-1 h-3/5 rounded-full bg-amber-400" />
  </div>
);

// Cells flex to share the board width (capped at max-w-11 so the strip never
// grows past its usual size) and take their height from the aspect ratio, so
// the whole strip always fits without horizontal scrolling.
const cellClass = (inWindow: boolean, selectable: boolean) => `
  flex-1 min-w-0 max-w-11 aspect-[11/14] rounded-md border transition-colors
  ${inWindow
    ? 'border-blue-500 bg-blue-200 dark:bg-blue-800'
    : selectable
      ? 'border-blue-400 bg-surface-elevated hocus:bg-blue-100 dark:hocus:bg-blue-900 cursor-pointer'
      : 'border-slate-300 dark:border-slate-600 bg-surface-elevated'}
`;

export const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();
  const { n, edges } = board;
  const k = currentWindowSize(board);
  const validStarts = new Set(legalMoves(board).map(m => m.a));

  const [selectedStart, setSelectedStart] = useState<number | null>(null);
  const [hoverStart, setHoverStart] = useState<number | null>(null);

  // Drop the in-progress selection whenever the board advances (own or bot move).
  useEffect(() => {
    setSelectedStart(null);
    setHoverStart(null);
  }, [ctx.moveCount]);

  const canInteract = ctx.isClientMoveAllowed;
  const previewStart = canInteract ? (hoverStart ?? selectedStart) : null;

  const windowCells = new Set(
    k !== null && previewStart !== null ? range(previewStart, previewStart + k) : []
  );
  const ghostEdges = new Set(
    k !== null && previewStart !== null
      ? boundaryEdgesToPlace(board, previewStart, previewStart + k - 1)
      : []
  );

  const selectStart = (a: number) => {
    if (!canInteract || !validStarts.has(a)) return;
    setSelectedStart(prev => (prev === a ? null : a));
  };

  const submit = () => {
    if (!canInteract || selectedStart === null || k === null) return;
    moves.placeWindow(board, selectedStart, selectedStart + k - 1);
  };

  // min-w-0 lets the board's flex item stay at its basis (rather than letting
  // the strip's intrinsic width inflate the section and push the sidebar onto
  // the next line on wide screens).
  return (
    <GameBoard className="min-w-0">
      <div className="flex items-center justify-center w-full">
        {range(n).flatMap(i => {
          const selectable = canInteract && validStarts.has(i);
          const cell = (
            <button
              key={`cell-${i}`}
              disabled={!selectable}
              onClick={() => selectStart(i)}
              onMouseEnter={() => selectable && setHoverStart(i)}
              onMouseLeave={() => setHoverStart(null)}
              onFocus={() => selectable && setHoverStart(i)}
              onBlur={() => setHoverStart(null)}
              aria-pressed={selectedStart === i}
              aria-label={t({
                hu: `${i + 1}. mező${selectable ? `, ${k} hosszú résztábla kezdete` : ''}`,
                en: `Cell ${i + 1}${selectable ? `, start of a length-${k} subtable` : ''}`
              })}
              className={cellClass(windowCells.has(i), selectable)}
            />
          );
          if (i === n - 1) return [cell];
          // Edge slot between cell i and cell i+1 (edge index i).
          const matched = edges[i];
          const ghost = ghostEdges.has(i);
          const edge = (
            <div
              key={`edge-${i}`}
              className="shrink-0 self-stretch w-1.5 sm:w-3 flex items-center justify-center"
            >
              {matched ? <Matchstick /> : ghost ? <Matchstick ghost /> : null}
            </div>
          );
          return [cell, edge];
        })}
      </div>

      {canInteract && (
        <button
          disabled={selectedStart === null}
          onClick={submit}
          className="primary-button w-auto mt-4 mx-auto"
        >
          {t({ hu: 'Rárakom a gyufákat', en: 'Place the matches' })}
        </button>
      )}
    </GameBoard>
  );
};
