import { range } from 'lodash';
import { GameBoard, useHoverPreview, type BoardClientProps } from '../../strategy-game-factory';
import { useTranslation } from '../../../language';
import { cap, type Board } from './gameplay';

// The pile UI shared by the pebble take-away games.
const StonePile = ({ board, isTakeAllowed, onTake, moveCount }: {
  board: Board; isTakeAllowed: (count: number) => boolean; onTake: (count: number) => void; moveCount: number
}) => {
  const { value, hoverProps } = useHoverPreview<number>(moveCount);
  const previewCount = value ?? 0;

  return (
    // rotate(180deg) makes the pile fill from the bottom (incomplete row on top)
    // while keeping left-to-right reading order, so pebble "1" is the top-left of
    // the pile and the count grows down and to the right. Each pebble re-rotates
    // 180° so its number stays upright. Pebbles are taken from the top, so DOM
    // index i corresponds to taking stones - i.
    <div className="flex flex-wrap justify-center gap-1.5 p-2 rotate-180">
      {range(board.stones).map(i => {
        const takeCount = board.stones - i; // clicking a pebble takes it and everything above
        // Only selectable pebbles drive the hover preview. Don't rely on the
        // `disabled` attribute to suppress this — some browsers (e.g. Safari)
        // still fire pointer events on disabled buttons.
        const canSelect = isTakeAllowed(takeCount);
        return (
          <button
            key={i}
            disabled={!canSelect}
            aria-label={`${takeCount}`}
            className={`
              w-[11%] sm:w-[8%] aspect-square rounded-full bg-stone-500 shadow-md shadow-stone-700
              flex items-center justify-center text-white font-semibold text-xs sm:text-sm rotate-180
              ${canSelect && takeCount <= previewCount ? 'opacity-30' : ''}
            `}
            onClick={() => onTake(takeCount)}
            {...(canSelect ? hoverProps(takeCount) : {})}
          >
            {canSelect && <span>{takeCount}</span>}
          </button>
        );
      })}
    </div>
  );
};

export const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();
  return (
    <GameBoard>
      <p className="text-center text-2xl font-bold mb-2">
        {t({ hu: 'Kavicsok', en: 'Pebbles' })}: {board.stones}
      </p>
      <StonePile
        board={board}
        isTakeAllowed={count => moves.take.isAllowed(board, count)}
        onTake={count => moves.take(board, count)}
        moveCount={ctx.moveCount}
      />
    </GameBoard>
  );
};

export const getPlayerStepDescription = ({ board }: { board: Board }) => ({
  hu: `Kattints egy kavicsra: legfeljebb ${cap(board)} kavicsot vehetsz el.`,
  en: `Click a pebble: you may take at most ${cap(board)} pebble(s).`
});
