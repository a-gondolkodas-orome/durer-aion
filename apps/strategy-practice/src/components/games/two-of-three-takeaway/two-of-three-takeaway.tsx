import { range } from 'lodash';
import {
  strategyGameFactory, testVariantLabel, fullVariantLabel, useMoveScopedState, type BoardClientProps, GameBoard
} from 'strategy-game-factory';
import { Trans, useTranslation } from 'react-i18next';
import { generateStartBoard, moves, type Board } from './gameplay';
import { randomBotStrategy, smartBotStrategy } from './bot-strategy';

const Pile = ({ count, index, selected, selectable, onClick }: {
  count: number; index: number; selected: boolean; selectable: boolean; onClick: () => void;
}) => {
  const { t } = useTranslation('two-of-three-takeaway');
  return (
    <button
      disabled={!selectable}
      onClick={onClick}
      aria-pressed={selected}
      aria-label={t('board.pile', { number: index + 1, chips: count })}
      className={`
        w-24 sm:w-32 rounded-lg border-2 p-2 flex flex-col items-center gap-2
        ${selected
          ? 'border-blue-500 bg-blue-100 dark:bg-blue-900'
          : 'border-slate-400 bg-surface-elevated enabled:hocus:border-blue-400'}
        disabled:opacity-40
      `}
    >
      {/* rotate(180deg) makes the heap fill from the bottom up, leaving the
          incomplete row on top so it reads as a pile resting on the ground. */}
      <div
        className="flex flex-wrap justify-center content-start gap-1.5 w-full min-h-32"
        style={{ transform: 'rotate(180deg)' }}
      >
        {range(count).map(c => (
          // Counter-rotate each chip so its drop shadow points down (the pile
          // container is flipped 180° to fill from the bottom up).
          <span
            key={c}
            className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-amber-400 dark:bg-amber-500
              border-2 border-amber-600 shadow-md shadow-amber-700/40 rotate-180"
          />
        ))}
      </div>
      <span className="text-2xl font-bold tabular-nums">{count}</span>
    </button>
  );
};

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation('two-of-three-takeaway');
  // Move-scoped: the in-progress selection expires when the board advances.
  const [firstSelected, setFirstSelected] = useMoveScopedState<number | null>(ctx.moveCount, null);

  // A pile can start a move when some other pile can partner it — the pair is
  // what the validator judges, so ask it rather than restate "not empty".
  const canTakeFrom = (i: number) => board.some((_, j) => moves.takeChips.isAllowed(board, i, j));

  const clickPile = (i: number) => {
    if (!canTakeFrom(i)) return;
    if (firstSelected === null) {
      setFirstSelected(i);
      return;
    }
    if (firstSelected === i) {
      setFirstSelected(null); // clicking the selected pile again deselects it
      return;
    }
    moves.takeChips(board, firstSelected, i);
  };

  return (
    <GameBoard>
      <div className="flex gap-3 sm:gap-8 justify-center items-end">
        {board.map((count, i) => (
          <Pile
            key={i}
            count={count}
            index={i}
            selected={firstSelected === i}
            selectable={canTakeFrom(i)}
            onClick={() => clickPile(i)}
          />
        ))}
      </div>
      {ctx.isClientMoveAllowed && (
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 h-5">
          {firstSelected === null
            ? t('board.pickFirst')
            : t('board.pickOther')}
        </p>
      )}
    </GameBoard>
  );
};

const Rule = () => {
  const { t } = useTranslation('two-of-three-takeaway');
  return <Trans t={t} i18nKey="rule" />;
};

const StepDescription = () => {
  const { t } = useTranslation('two-of-three-takeaway');
  return t('step');
};

export const TwoOfThreeTakeaway = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    getPlayerStepDescription: () => <StepDescription />
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      generateStartBoard,
      label: testVariantLabel
    },
    {
      botStrategy: smartBotStrategy,
      generateStartBoard,
      label: fullVariantLabel,
      isDefault: true
    }
  ]
});
