import { range } from 'lodash';
import {
  type BoardClientProps, type MoveOutcome, type Ctx, GameBoard, useHoverPreview
} from '../../strategy-game-factory';
import { useTranslation } from '../../../language';
import {
  type Board, type Orientation, type Move,
  getRectangleAt, applyMove, isEmpty, isRemovalAllowed
} from './helpers';

type Selected = { r: number; c: number } | null

export const BoardClient = ({ board, ctx, events, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();
  const { grid } = board;
  const selected = ctx.turnState as Selected;
  const { value: hoverOrientation, hoverProps, clear: clearHover } = useHoverPreview<Orientation>(ctx.moveCount);
  const rect = selected ? getRectangleAt(grid, selected.r, selected.c) : null;

  const clickDisc = (r: number, c: number) => {
    if (!ctx.isClientMoveAllowed) return;
    // Picking another disc keeps moveCount unchanged, so drop the hover
    // preview explicitly — it belonged to the previous selection.
    clearHover();
    events.setTurnState(selected && selected.r === r && selected.c === c ? null : { r, c });
  };

  const discClass = (r: number, c: number) => {
    if (!rect || !selected) return 'bg-blue-500';
    const inRect = r >= rect.minR && r <= rect.maxR && c >= rect.minC && c <= rect.maxC;
    if (!inRect) return 'bg-blue-500';
    const sameRow = r === selected.r;
    const sameCol = c === selected.c;
    // Only the removable lines through the selected disc: its row and its column
    // within the same rectangle.
    if ((hoverOrientation === 'row' && sameRow) || (hoverOrientation === 'col' && sameCol)) {
      return 'bg-slate-500';
    }
    if (sameRow || sameCol) return 'bg-blue-500 ring-2 ring-amber-400';
    return 'bg-blue-500';
  };

  const isSelected = (r: number, c: number) => !!selected && selected.r === r && selected.c === c;

  return (
    <GameBoard>
      <div className="flex justify-center py-2">
        <table className="border-collapse">
          <tbody>
            {range(grid.length).map(r => (
              <tr key={r}>
                {range(grid[0].length).map(c => (
                  <td key={c} className="border border-slate-300 dark:border-slate-600 p-0">
                    <button
                      aria-label={t({
                        hu: `korong ${r + 1}. sor ${c + 1}. oszlop`,
                        en: `disc row ${r + 1} column ${c + 1}`
                      })}
                      className="size-9 sm:size-11 flex items-center justify-center"
                      disabled={!ctx.isClientMoveAllowed || !grid[r][c]}
                      onClick={() => clickDisc(r, c)}
                    >
                      {grid[r][c] && (
                        <span
                          className={`size-7 sm:size-9 rounded-full transition-colors ${discClass(r, c)} ${
                            isSelected(r, c) ? 'ring-4 ring-amber-500' : ''
                          }`}
                        />
                      )}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && rect && ctx.isClientMoveAllowed && (
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          {[
            {
              orientation: 'row' as const,
              count: rect.maxC - rect.minC + 1,
              label: { hu: 'Sor levétele', en: 'Remove row' }
            },
            {
              orientation: 'col' as const,
              count: rect.maxR - rect.minR + 1,
              label: { hu: 'Oszlop levétele', en: 'Remove column' }
            }
          ].map(({ orientation, count, label }) => (
            <button
              key={orientation}
              className="primary-button w-auto grow"
              onClick={() => moves.removeLine(board, { ...selected, orientation })}
              {...hoverProps(orientation)}
            >
              {t(label)} ({count})
            </button>
          ))}
        </div>
      )}
    </GameBoard>
  );
};

export const moves = {
  removeLine: {
    validate: (board: Board, _, move: Move) => isRemovalAllowed(board.grid, move),
    apply: (board: Board, { ctx }: { ctx: Ctx }, move: Move): MoveOutcome<Board> => {
      const nextBoard = { grid: applyMove(board.grid, move) };
      // nextTurnState clears the disc the BoardClient parked in ctx.turnState
      // while the player was choosing between its row and its column.
      if (isEmpty(nextBoard.grid)) {
        return { nextBoard, nextTurnState: null, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, nextTurnState: null, isTurnEnd: true };
    }
  }
};

export const getPlayerStepDescription = ({ ctx }: { board: Board; ctx: Ctx }) => {
  return ctx.turnState
    ? {
      hu: 'Vedd le a kijelölt korong sorát vagy oszlopát a gombokkal, vagy válassz másik korongot.',
      en: 'Remove the selected disc’s row or column with the buttons, or pick another disc.'
    }
    : {
      hu: 'Kattints egy korongra, majd válaszd a sorának vagy oszlopának levételét.',
      en: 'Click a disc, then choose to remove its row or its column.'
    };
};
