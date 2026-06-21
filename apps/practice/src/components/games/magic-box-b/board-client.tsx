import { range } from 'lodash';
import { useTranslation } from '../../language';
import { GameBoard, type BoardClientProps } from '../../game-factory';
import { LINES, LINE_LABELS, type Board } from './helpers';

const BOX_SIZE = 'w-64 sm:w-72';

export const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();
  const { stones, pendingLine } = board;
  const canDesignate = ctx.isClientMoveAllowed && pendingLine === null;

  const isCellClickable = (id) => {
    if (!ctx.isClientMoveAllowed || pendingLine === null) return false;
    return LINES[pendingLine].includes(id) && !stones[id];
  };

  const clickCell = (id) => {
    if (!isCellClickable(id)) return;
    moves.placeStone(board, id);
  };

  const designateLine = (lineIndex) => {
    if (!canDesignate) return;
    moves.designateLine(board, lineIndex);
  };

  const isCellHighlighted = (id) => pendingLine !== null && LINES[pendingLine].includes(id);

  const selectorButtonClass = 'secondary-button flex items-center justify-center text-lg';

  return (
    <GameBoard className="flex justify-center">
      <div className="flex flex-col items-start gap-3">
        <div className="flex gap-3">
          <div
            className={`grid grid-cols-3 grid-rows-3 bg-slate-200 dark:bg-slate-600
              gap-1 p-1 aspect-square ${BOX_SIZE}`}
          >
            {range(9).map(id => (
              <button
                key={id}
                disabled={!isCellClickable(id)}
                onClick={() => clickCell(id)}
                className={`p-[20%] ${
                  isCellHighlighted(id) ? 'bg-amber-200 dark:bg-amber-700' : 'bg-surface-elevated'
                }`}
              >
                {stones[id] && (
                  <span className="w-full h-full block rounded-full bg-slate-800 dark:bg-slate-200"></span>
                )}
              </button>
            ))}
          </div>

          <div className="grid grid-rows-3 gap-1">
            {range(3).map(row => (
              <button
                key={row}
                disabled={!canDesignate}
                onClick={() => designateLine(row)}
                title={t(LINE_LABELS[row])}
                aria-label={t(LINE_LABELS[row])}
                className={`${selectorButtonClass} w-10`}
              >
                ←
              </button>
            ))}
          </div>
        </div>

        <div className={`grid grid-cols-3 gap-1 ${BOX_SIZE}`}>
          {range(3).map(col => (
            <button
              key={col}
              disabled={!canDesignate}
              onClick={() => designateLine(3 + col)}
              title={t(LINE_LABELS[3 + col])}
              aria-label={t(LINE_LABELS[3 + col])}
              className={`${selectorButtonClass} h-10`}
            >
              ↑
            </button>
          ))}
        </div>
      </div>
    </GameBoard>
  );
};
