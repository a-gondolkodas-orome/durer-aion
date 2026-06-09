import { isEqual } from 'lodash';
import { useTranslation } from '../../language';
import { hasActivePair, type Board } from './strategy';
import { GameBoard, type BoardClientProps } from '../../game-factory';

export type TurnState = { levelIdx: number; slotIdx: number } | null;

const chipBase = 'rounded-lg border-2 py-2 font-bold min-w-10';

const PlaceholderSlot = () => (
  <button disabled className={`${chipBase} border-dashed text-transparent select-none`}>0</button>
);

const ConsumedSlot = ({ value }) => (
  <button disabled className={`${chipBase} opacity-40 line-through`}>{value}</button>
);

const ActiveSlot = ({ value, isSelected, isDisabled, onClick }) => (
  <button
    className={`${chipBase} ${
      isSelected ? 'bg-blue-500 border-blue-400 text-white'
        : isDisabled ? 'bg-slate-200 opacity-50'
          : 'border-slate-400 hocus:bg-blue-50 hocus:border-blue-400'
    }`}
    onClick={onClick}
    disabled={isDisabled}
  >
    {value}
  </button>
);

export const BoardClient = ({ board, ctx, events, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();
  const turnState = ctx.turnState as TurnState;

  const handleClick = ({ levelIdx, slotIdx }) => {
    if (!ctx.isClientMoveAllowed) return;
    const slot = board.levels[levelIdx][slotIdx];
    if (!slot || slot.state !== 'active') return;

    if (turnState === null) {
      if (!hasActivePair(board.levels[levelIdx])) return;
      events.setTurnState({ levelIdx, slotIdx });
      return;
    }
    if (isEqual(turnState, { levelIdx, slotIdx })) {
      events.setTurnState(null);
      return;
    }

    moves.combineTwo(board, { levelIdx, indices: [turnState.slotIdx, slotIdx] });
  };

  return (
    <GameBoard>
      <p className="text-center text-lg font-semibold mb-4">
        {t({ hu: 'Célszám (k)', en: 'Target (k)' })}:{' '}
        <span className="text-2xl font-bold text-blue-600">
          {board.target}
        </span>
      </p>
      <div className="flex flex-col gap-3">
        {[3, 2, 1, 0].map((levelIdx) => {
          const level = board.levels[levelIdx];
          const isDisabled = !ctx.isClientMoveAllowed
            || (turnState !== null && turnState.levelIdx !== levelIdx)
            || (turnState === null && !hasActivePair(level));
          return (
            <div key={levelIdx} className="flex flex-col items-center gap-1">
              <div className="flex flex-wrap justify-center gap-2">
                {level.map((slot, slotIdx) => {
                  if (slot === null) return <PlaceholderSlot key={slotIdx} />;
                  if (slot.state === 'consumed') return <ConsumedSlot key={slotIdx} value={slot.value} />;
                  return (
                    <ActiveSlot
                      key={slotIdx}
                      value={slot.value}
                      isSelected={isEqual(turnState, { levelIdx, slotIdx })}
                      isDisabled={isDisabled}
                      onClick={() => handleClick({ levelIdx, slotIdx })}
                    />
                  );
                })}
              </div>
              <span className="text-xs text-slate-500">
                {t({ hu: `${levelIdx + 1}. szint`, en: `Level ${levelIdx + 1}` })}
              </span>
            </div>
          );
        })}
      </div>
    </GameBoard>
  );
};
