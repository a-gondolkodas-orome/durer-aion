import React from 'react';
import { isEqual } from 'lodash';
import { useTranslation } from '../../language/translate';
import { hasActivePair } from './strategy';

const chipBase = 'rounded-lg border-2 px-3 py-2 font-bold text-lg min-w-12 text-center';

const PlaceholderSlot = () => (
  <div className={`${chipBase} border-dashed border-slate-200 bg-slate-50 text-transparent select-none`}>0</div>
);

const ConsumedSlot = ({ value }) => (
  <div className={`${chipBase} border-slate-200 bg-slate-50 text-slate-300 line-through`}>{value}</div>
);

const ActiveSlot = ({ value, isSelected, isDisabled, onClick }) => (
  <button
    className={`${chipBase} transition-colors ${
      isSelected ? 'bg-blue-600 border-blue-700 text-white'
        : isDisabled ? 'bg-slate-100 border-slate-300 text-slate-500 cursor-default'
          : 'bg-white border-slate-400 hover:bg-blue-50 hover:border-blue-400 cursor-pointer'
    }`}
    onClick={onClick}
    disabled={isDisabled}
  >
    {value}
  </button>
);

export const BoardClient = ({ board, ctx, events, moves }) => {
  const { t } = useTranslation();

  const handleClick = ({ levelIdx, slotIdx }) => {
    if (!ctx.isClientMoveAllowed) return;
    const slot = board.levels[levelIdx][slotIdx];
    if (!slot || slot.state !== 'active') return;

    if (ctx.turnState === null) {
      if (!hasActivePair(board.levels[levelIdx])) return;
      events.setTurnState({ levelIdx, slotIdx });
      return;
    }
    if (isEqual(ctx.turnState, { levelIdx, slotIdx })) {
      events.setTurnState(null);
      return;
    }

    moves.combineTwo(board, { levelIdx, indices: [ctx.turnState.slotIdx, slotIdx] });
  };

  return (
    <section className="p-2 shrink-0 grow basis-2/3">
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
            || (ctx.turnState !== null && ctx.turnState.levelIdx !== levelIdx)
            || (ctx.turnState === null && !hasActivePair(level));
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
                      isSelected={isEqual(ctx.turnState, { levelIdx, slotIdx })}
                      isDisabled={isDisabled}
                      onClick={() => handleClick({ levelIdx, slotIdx })}
                    />
                  );
                })}
              </div>
              <span className="text-xs text-slate-400">
                {t({ hu: `${levelIdx + 1}. szint`, en: `Level ${levelIdx + 1}` })}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
};
