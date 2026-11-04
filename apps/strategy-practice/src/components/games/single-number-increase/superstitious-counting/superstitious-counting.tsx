import { range } from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import {
  strategyGameFactory, testVariantLabel, fullVariantLabel, type BoardClientProps, GameBoard
} from 'strategy-game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { generateStartBoard, generateTestStartBoard, moves, type Board } from './gameplay';

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation('single-number-increase');
  const fields = range(board.target + 14);


  return (
  <GameBoard>
    <div className="flex flex-wrap gap-2">
      {fields.map(i =>
        <button
          key={i}
          disabled={!moves.step.isAllowed(board, i - board.current)}
          onClick={() => moves.step(board, i - board.current)}
          className={`
            border-2 rounded-sm text-2xl min-w-[4ch] py-1 font-bold
            enabled:bg-green-200 dark:enabled:bg-green-700 enabled:hocus:bg-green-400 dark:enabled:hocus:bg-green-600
            ${board.restricted && i === board.current + board.restricted ? 'bg-red-200 dark:bg-red-900' : '' }
            ${i < board.current ? 'opacity-50' : ''}
            ${i >= board.target ? 'opacity-50 border-purple-600' : ''}
          `}
        >{ i === board.current ? 'X' : i }
      </button>
      )}
    </div>
    <p className="text-xl mt-2">
      {t('superstitiousCounting.board.target', { target: board.target })}
    </p>
    {ctx.isClientMoveAllowed && (
      <p className="text-xl mt-2">
        {t('superstitiousCounting.board.restriction', {
          previous: board.restricted ? (13 - board.restricted) : '-',
          forbidden: board.restricted || '-'
        })}
      </p>
    )}
  </GameBoard>
  );
};

const Rule = () => {
  const { t } = useTranslation('single-number-increase');
  return <Trans t={t} i18nKey="superstitiousCounting.rule" />;
};

const StepDescription = () => {
  const { t } = useTranslation('single-number-increase');
  return t('superstitiousCounting.step');
};

export const SuperstitiousCounting = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    getPlayerStepDescription: () => <StepDescription />
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      generateStartBoard: generateTestStartBoard,
      label: testVariantLabel
    },
    { botStrategy: smartBotStrategy, generateStartBoard, label: fullVariantLabel, isDefault: true }
  ]
});
