import { useEffect, useRef, useState } from 'react';
import { range } from 'lodash';
import { useTranslation } from '../../../language';
import { GameBoard, type BoardClientProps } from '../../strategy-game-factory';
import { type Board, type Cell, colorOf } from './gameplay';

// Translucent version of each disc colour, used for the recolour pulse ring.
const pulseColor: Record<'red' | 'blue', string> = {
  red: 'rgba(239, 68, 68, 0.75)', // red-500
  blue: 'rgba(59, 130, 246, 0.75)' // blue-500
};

// Attention pulse played on a disc that was just recoloured: it grows briefly
// and emits a fading ring in its new colour. Kept here (Web Animations API)
// rather than as a global @keyframes so this game-specific effect stays inside
// the game. Does nothing if the browser lacks element.animate (e.g. jsdom).
const playRecolourPulse = (el: HTMLElement, color: 'red' | 'blue'): void => {
  el.animate?.(
    [
      { transform: 'scale(1)', boxShadow: `0 0 0 0 ${pulseColor[color]}` },
      { transform: 'scale(1.3)', boxShadow: `0 0 0 6px ${pulseColor[color]}`, offset: 0.35 },
      { transform: 'scale(1)', boxShadow: '0 0 0 12px transparent' }
    ],
    { duration: 900, easing: 'ease-out' }
  );
};

const discClass = (cell: 'red' | 'blue' | null): string => {
  if (cell === 'red') return 'bg-red-500';
  if (cell === 'blue') return 'bg-blue-500';
  return '';
};

export const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();
  const { cells } = board;
  const myColor = ctx.currentPlayer === null ? null : colorOf(ctx.currentPlayer);
  const canInteract = ctx.isClientMoveAllowed && myColor !== null;

  const [selectedFrom, setSelectedFrom] = useState<number | null>(null);

  // Drop any in-progress selection whenever the board advances.
  useEffect(() => setSelectedFrom(null), [ctx.moveCount]);

  // Pulse discs that were just recoloured (a cell that held a disc and now holds
  // the opposite colour) so the flip is easy to spot. We diff against the
  // previous board; only genuine plies (moveCount + 1) count, so restarting or
  // choosing a role never pulses.
  const discRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  const prevCellsRef = useRef<Cell[]>(cells);
  const prevMoveCountRef = useRef<number>(ctx.moveCount);

  useEffect(() => {
    const prev = prevCellsRef.current;
    const wasSequentialPly = ctx.moveCount === prevMoveCountRef.current + 1;
    prevCellsRef.current = cells;
    prevMoveCountRef.current = ctx.moveCount;
    if (!wasSequentialPly) return;

    cells.forEach((c, i) => {
      if (c === null || prev[i] === null || prev[i] === c) return;
      const el = discRefs.current.get(i);
      if (el) playRecolourPulse(el, c);
    });
  }, [ctx.moveCount, cells]);

  // Every "may I?" question the board asks goes through the moves' own
  // validators, so the highlighting and the engine agree by construction.
  const isTarget = (to: number) =>
    selectedFrom !== null && moves.moveDisc.isAllowed(board, selectedFrom, to);
  const isPlaceable = (at: number) => moves.placeDisc.isAllowed(board, at);
  // A disc is worth picking up only if it has somewhere to go; being of the
  // player's own colour is already implied by `moveDisc`'s validator.
  const isMovable = (from: number) => range(cells.length).some(to => moves.moveDisc.isAllowed(board, from, to));

  const clickCell = (i: number) => {
    if (!canInteract || myColor === null) return;
    if (selectedFrom !== null) {
      if (isTarget(i)) {
        moves.moveDisc(board, selectedFrom, i);
        return;
      }
      if (i === selectedFrom) return setSelectedFrom(null);
    }
    if (cells[i] === myColor) {
      return setSelectedFrom(isMovable(i) ? i : null);
    }
    if (isPlaceable(i)) {
      moves.placeDisc(board, i);
      return;
    }
    setSelectedFrom(null);
  };

  const cellState = (i: number): 'selected' | 'target' | 'placeable' | 'movable' | 'plain' => {
    if (i === selectedFrom) return 'selected';
    if (isTarget(i)) return 'target';
    if (selectedFrom === null) {
      if (isMovable(i)) return 'movable';
      if (isPlaceable(i)) return 'placeable';
    }
    return 'plain';
  };

  // Movable discs are ringed in the player's own colour ("these are your pieces,
  // pick one up"), keeping them distinct from the blue selected/target
  // highlighting that marks the move currently in progress.
  const selectedRing = myColor === 'red'
    ? 'border-red-400 ring-2 ring-red-300 dark:ring-red-600 hocus:ring-red-500'
    : 'border-blue-400 ring-2 ring-blue-300 dark:ring-blue-600 hocus:ring-blue-500';

  const ring: Record<ReturnType<typeof cellState>, string> = {
    selected: `${selectedRing} opacity-75`,
    target: 'border-blue-400 border-dashed bg-blue-200 dark:bg-blue-700',
    placeable: '',
    movable: 'border-blue-500 bg-blue-200 dark:bg-blue-700',
    plain: ''
  };

  const label = (i: number): string => {
    const content = cells[i] === 'red'
      ? t({ hu: 'piros korong', en: 'red disc' })
      : cells[i] === 'blue'
        ? t({ hu: 'kék korong', en: 'blue disc' })
        : t({ hu: 'üres', en: 'empty' });
    return t({ hu: `${i + 1}. mező, ${content}`, en: `Field ${i + 1}, ${content}` });
  };

  return (
    <GameBoard>
      {/* The strip is kept on a single line: cells share the available width
          (flex-1 + aspect-square) so up to 12 fields fit without wrapping, which
          keeps the row's linear order obvious. The max-width stops them from
          growing oversized on wide screens. */}
      <div className="flex gap-1 sm:gap-1.5 justify-center items-center py-2 w-full max-w-xl mx-auto">
        {cells.map((cell, i) => {
          const state = cellState(i);
          const actionable = canInteract
            && (state === 'movable' || state === 'placeable' || state === 'target' || state === 'selected');
          return (
            <button
              key={i}
              onClick={() => clickCell(i)}
              disabled={!actionable}
              aria-pressed={state === 'selected'}
              aria-label={label(i)}
              className={`relative flex-1 min-w-0 aspect-square rounded-md sm:rounded-lg border-2
                flex items-center justify-center bg-surface-elevated transition-colors ${ring[state]}
              `}
            >
              {cell !== null && (
                <span
                  ref={el => {
                    if (el) discRefs.current.set(i, el);
                    else discRefs.current.delete(i);
                  }}
                  className={`w-4/5 aspect-square rounded-full shadow-sm transition-colors duration-500
                    ${discClass(cell)}`}
                />
              )}
              {(state === 'placeable' || state === 'target') && (
                <span
                  className={`absolute w-4/5 aspect-square rounded-full border-2 border-dashed
                    ${myColor === 'red' ? 'border-red-400' : 'border-blue-400'}`}
                />
              )}
            </button>
          );
        })}
      </div>

      {canInteract && (
        <div className="flex justify-center mt-4">
          <button onClick={() => moves.pass(board)} className="primary-button w-auto">
            {t({ hu: 'Passzolok', en: 'Pass' })}
          </button>
        </div>
      )}
    </GameBoard>
  );
};
