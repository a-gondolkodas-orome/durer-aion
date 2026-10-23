import {
  strategyGameFactory, useMoveScopedState, type BoardClientProps, type Ctx, GameBoard,
  testVariantLabel, fullVariantLabel
} from 'strategy-game-factory';
import { Trans, useTranslation } from 'react-i18next';
import { startBoard, moves, type Board } from './gameplay';
import { randomBotStrategy, smartBotStrategy } from './bot-strategy';

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation('latin-square-filling');
  // Move-scoped: the pending selection is gone once the board advances.
  const [selectedCell, setSelectedCell] = useMoveScopedState<number | null>(ctx.moveCount, null);

  const clickCell = (cell: number) => {
    if (!ctx.isClientMoveAllowed || board[cell] !== 0) return;
    setSelectedCell(prev => (prev === cell ? null : cell));
  };

  const placeDigit = (digit: number) => moves.placeDigit(board, selectedCell, digit);

  // Which digits the selected cell will accept — asked of the move itself, so
  // the keypad and the engine cannot disagree.
  const allowed = [1, 2, 3].filter(
    digit => selectedCell !== null && moves.placeDigit.isAllowed(board, selectedCell, digit)
  );

  return (
    <GameBoard>
      <div
        className="grid grid-cols-3 bg-slate-300 dark:bg-slate-600 gap-1 p-1 max-w-xs mx-auto"
        onKeyDown={e => {
          if (['1', '2', '3'].includes(e.key) && allowed.includes(Number(e.key))) {
            placeDigit(Number(e.key));
          }
        }}
      >
        {board.map((value, cell) => {
          const isEmpty = value === 0;
          const isSelected = selectedCell === cell;
          return (
            <button
              key={cell}
              disabled={!ctx.isClientMoveAllowed || !isEmpty}
              onClick={() => clickCell(cell)}
              aria-label={
                isEmpty
                  ? t('board.emptyCell')
                  : t('board.digit', { value })
              }
              className={`
                aspect-square flex items-center justify-center text-4xl sm:text-5xl font-bold tabular-nums
                ${isSelected
                  ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500 ring-inset'
                  : 'bg-surface-elevated'}
                ${isEmpty
                  ? 'enabled:hocus:bg-blue-50 dark:enabled:hocus:bg-blue-950'
                  : 'text-slate-700 dark:text-slate-200'}
              `}
            >
              {isEmpty ? '' : value}
            </button>
          );
        })}
      </div>

      {ctx.isClientMoveAllowed && selectedCell !== null && (
        <div className="mt-4 flex flex-col items-center gap-2">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {allowed.length > 0
              ? t('board.whichDigit')
              : t('board.noDigitFits')}
          </p>
          <div className="flex gap-2">
            {[1, 2, 3].map(digit => (
              <button
                key={digit}
                disabled={!allowed.includes(digit)}
                onClick={() => placeDigit(digit)}
                className="w-14 h-14 rounded-lg border-2 text-2xl font-bold tabular-nums
                  enabled:hocus:bg-blue-100 dark:enabled:hocus:bg-blue-900
                  enabled:hocus:border-blue-400 border-slate-400 disabled:opacity-30"
              >
                {digit}
              </button>
            ))}
          </div>
        </div>
      )}
    </GameBoard>
  );
};

const StepDescription = ({ ctx }: { ctx: Ctx }) => {
  const { t } = useTranslation('latin-square-filling');
  return ctx.currentPlayer === 0 ? t('step.first') : t('step.second');
};

const Rule = () => {
  const { t } = useTranslation('latin-square-filling');
  return <Trans t={t} i18nKey="rule" />;
};

export const LatinSquareFilling = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    getPlayerStepDescription: ({ ctx }) => <StepDescription ctx={ctx} />
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      startBoards: [startBoard],
      label: testVariantLabel
    },
    {
      botStrategy: smartBotStrategy,
      startBoards: [startBoard],
      label: fullVariantLabel,
      isDefault: true
    }
  ]
});
