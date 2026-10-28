import { range } from 'lodash';
import { useTranslation } from 'react-i18next';
import { GameBoard, type BoardClientProps } from 'strategy-game-factory';
import { BOARD_SIZE, winningLine, type Board, type TurnState } from './gameplay';

export const BoardClient = ({ board, moves }: BoardClientProps<Board, TurnState>) => {
  const { t } = useTranslation('two-xs-one-o');
  const line = winningLine(board.cells) ?? [];
  const empty = t('board.empty');

  const cellLabel = (id: number) => t('board.cell', {
    row: Math.floor(id / BOARD_SIZE) + 1,
    column: id % BOARD_SIZE + 1,
    content: board.cells[id] ?? empty
  });

  // The grid gap is the border: the container colour shows through it, so every
  // cell needs its own background or the gaps disappear into it.
  return (
    <GameBoard>
      <div className="grid grid-cols-5 bg-slate-200 dark:bg-slate-600 gap-1 p-1">
        {range(BOARD_SIZE * BOARD_SIZE).map(id => (
          <button
            key={id}
            aria-label={cellLabel(id)}
            disabled={!moves.placeMark.isAllowed(board, id)}
            onClick={() => moves.placeMark(board, id)}
            className={`
              aspect-square text-3xl sm:text-5xl font-bold
              ${line.includes(id) ? 'bg-blue-200 dark:bg-blue-900' : 'bg-surface-elevated'}
              ${board.cells[id] === 'X' ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-400'}
              enabled:hocus:bg-slate-100 dark:enabled:hocus:bg-slate-700
            `}
          >
            {board.cells[id]}
          </button>
        ))}
      </div>
    </GameBoard>
  );
};
