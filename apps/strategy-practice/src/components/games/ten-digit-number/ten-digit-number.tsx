import { Trans, useTranslation } from 'react-i18next';
import {
  strategyGameFactory, testVariantLabel, fullVariantLabel, type BoardClientProps, GameBoard
} from 'strategy-game-factory';
import { availableDigits, moves, totalDigits, type Board } from './gameplay';
import { randomBotStrategy, smartBotStrategy } from './bot-strategy';

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation('ten-digit-number');
  const slots = Array.from({ length: totalDigits }, (_, i) =>
    i < board.digits.length ? board.digits[i] : null
  );

  let numberSummary: string | null = null;
  if (board.digits.length === totalDigits) {
    const num = board.digits.reduce((acc, d) => acc * 10 + d, 0);
    const remainder = board.sumMod9;
    const quotient = (num - remainder) / 9;
    const fmt = (n: number) => n.toLocaleString();
    const expr = remainder === 0
      ? `${fmt(num)} = ${fmt(quotient)} · 9`
      : `${fmt(num)} = ${fmt(quotient)} · 9 + ${remainder}`;
    numberSummary = t('board.number', { expr });
  }

  return (
    <GameBoard>
      <div className="flex gap-1 mb-2 flex-wrap">
        {slots.map((d, i) => {
          const isNextSlot = d === null && i === board.digits.length && ctx.phase === 'play';
          const slotClass = isNextSlot
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900 text-blue-400 dark:text-blue-300'
            : `border-slate-600 ${d === null ? 'opacity-50' : ''}`;
          return (
            <div
              key={i}
              className={`border-2 w-10 py-2 rounded-sm text-center text-2xl ${slotClass}`}
            >
              {d ?? '?'}
            </div>
          );
        })}
      </div>
      {numberSummary && <p className="text-sm mb-2">{numberSummary}</p>}
      <div className="mt-6 pt-4 border-t flex gap-2 flex-wrap">
        {availableDigits.map(d => (
          <button
            key={d}
            disabled={!moves.chooseDigit.isAllowed(board, d)}
            onClick={(e) => { moves.chooseDigit(board, d); e.currentTarget.blur(); }}
            className="rounded-lg border-2 text-2xl w-12 py-2 font-bold
              enabled:hocus:bg-blue-100 dark:enabled:hocus:bg-blue-900
              enabled:hocus:border-blue-300 disabled:opacity-50"
          >
            {d}
          </button>
        ))}
      </div>
    </GameBoard>
  );
};

const Rule = () => {
  const { t } = useTranslation('ten-digit-number');
  return <Trans t={t} i18nKey="rule" />;
};

const StepDescription = () => {
  const { t } = useTranslation('ten-digit-number');
  return t('step');
};

export const TenDigitNumber = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    roleLabels: [t => t('ten-digit-number:role.first'), t => t('ten-digit-number:role.second')],
    getPlayerStepDescription: () => <StepDescription />
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      label: testVariantLabel
    },
    {
      botStrategy: smartBotStrategy,
      startBoards: [{ digits: [], sumMod9: 0 }],
      label: fullVariantLabel,
      isDefault: true
    }
  ]
});
