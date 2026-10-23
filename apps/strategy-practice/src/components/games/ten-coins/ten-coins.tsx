import { range } from 'lodash';
import {
  strategyGameFactory, testVariantLabel, type BoardClientProps, type StrategyArgs, GameBoard
} from 'strategy-game-factory';
import { Trans, useTranslation } from 'react-i18next';
import {
  generateStartBoardC, generateStartBoardD, generateTestStartBoard, moves,
  type Board, type TurnState
} from './gameplay';
import { distinctValues, randomBotStrategy, smartBotStrategy } from './bot-strategy';

const BoardClient = ({ board, ctx, setTurnState, moves }: BoardClientProps<Board, TurnState>) => {
  const { t } = useTranslation('ten-coins');
  const selectedValue = ctx.turnState;
  const presentValues = distinctValues(board);

  // Asking about L = 1 asks whether these coins can be changed at all: it is the
  // most generous target, so value-1 coins fall out as unselectable.
  const selectValue = (v: number) => {
    if (!moves.convert.isAllowed(board, v, 1)) return;
    setTurnState(selectedValue === v ? null : v);
  };

  const chooseTarget = (l: number) => {
    moves.convert(board, selectedValue, l);
    setTurnState(null);
  };

  return (
    <GameBoard>
      <div className="flex flex-wrap items-end gap-3">
        {presentValues.map(v => {
          const count = board.filter(c => c === v).length;
          const isSelected = selectedValue === v;
          return (
            <button
              key={v}
              disabled={!moves.convert.isAllowed(board, v, 1)}
              onClick={() => selectValue(v)}
              aria-pressed={isSelected}
              aria-label={t('board.coinGroup', { amount: count, value: v })}
              className={`
                flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors
                ${isSelected
                  ? 'border-blue-500 bg-blue-100 dark:bg-blue-900'
                  : 'border-transparent enabled:hocus:bg-slate-100 dark:enabled:hocus:bg-slate-700'}
                disabled:cursor-default
              `}
            >
              {/* rotate(180deg) fills the pile from the bottom, leaving the
                  incomplete row on top; each coin re-rotates so it stays upright. */}
              <div className="flex flex-wrap gap-1 justify-center max-w-36"
                style={{ transform: 'rotate(180deg)' }}
              >
                {range(count).map(i => (
                  <div key={i} style={{ transform: 'rotate(180deg)' }}>
                    <Coin value={v} />
                  </div>
                ))}
              </div>
              <span className="text-sm font-semibold">
                {t('board.amount', { amount: count })}
              </span>
            </button>
          );
        })}
      </div>

      {selectedValue !== null && (
        <div className="mt-6 pt-4 border-t flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold">
            {t('board.changeTo')}
          </span>
          {range(1, selectedValue).map(l => (
            <button
              key={l}
              disabled={!moves.convert.isAllowed(board, selectedValue, l)}
              onClick={() => chooseTarget(l)}
              aria-label={t('board.target', { value: l })}
              className="rounded-full transition-transform enabled:hocus:scale-110
                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              <Coin value={l} />
            </button>
          ))}
        </div>
      )}
    </GameBoard>
  );
};

const coinColors: Record<number, string> = {
  1: 'bg-slate-200 border-slate-500 text-slate-800 dark:bg-slate-600 dark:border-slate-300 dark:text-slate-100',
  2: 'bg-blue-200 border-blue-600 text-blue-900 dark:bg-blue-800 dark:border-blue-300 dark:text-blue-100',
  3: 'bg-green-200 border-green-600 text-green-900 dark:bg-green-800 dark:border-green-300 dark:text-green-100',
  4: 'bg-red-200 border-red-600 text-red-900 dark:bg-red-800 dark:border-red-300 dark:text-red-100',
  5: 'bg-yellow-200 border-yellow-600 text-yellow-900 dark:bg-yellow-800 dark:border-yellow-300 dark:text-yellow-100'
};

const Coin = ({ value }: { value: number }) => (
  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center
    text-lg font-bold ${coinColors[value]}`}
  >
    {value}
  </div>
);

const StepDescription = ({ ctx }: Pick<StrategyArgs<Board, TurnState>, 'ctx'>) => {
  const { t } = useTranslation('ten-coins');
  return ctx.turnState !== null
    ? t('step.chooseTarget', { value: ctx.turnState })
    : t('step.chooseValue');
};

// Without `maxValue`, the rule covering both value ranges.
const Rule = ({ maxValue }: { maxValue?: number }) => {
  const { t } = useTranslation('ten-coins');
  return maxValue === undefined
    ? <Trans t={t} i18nKey="rule.generic" />
    : <Trans t={t} i18nKey="rule.withMax" values={{ maxValue }} />;
};

export const TenCoins = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    getPlayerStepDescription: ({ ctx }) => <StepDescription ctx={ctx} />
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      id: 'test',
      botStrategy: randomBotStrategy,
      generateStartBoard: generateTestStartBoard,
      label: testVariantLabel
    },
    {
      id: '4-values',
      botStrategy: smartBotStrategy,
      generateStartBoard: generateStartBoardC,
      rule: <Rule maxValue={4} />,
      label: t => t('ten-coins:variant.fourValues'),
      isDefault: true
    },
    {
      id: '5-values',
      botStrategy: smartBotStrategy,
      generateStartBoard: generateStartBoardD,
      rule: <Rule maxValue={5} />,
      label: t => t('ten-coins:variant.fiveValues')
    }
  ]
});
