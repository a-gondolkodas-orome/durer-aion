import { Trans, useTranslation } from 'react-i18next';
import { strategyGameFactory, testVariantLabel, fullVariantLabel } from 'strategy-game-factory';
import { BoardClient } from './board-client';
import { generateStartBoard, moves, nonEmptyIndices, type Board } from './gameplay';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';

const Rule = () => {
  const { t } = useTranslation('take-and-point');
  return <Trans t={t} i18nKey="rule" />;
};

const StepDescription = ({ board }: { board: Board }) => {
  const { t } = useTranslation('take-and-point');
  if (board.pointed === null) {
    return nonEmptyIndices(board.piles).length === 1 ? t('step.pointLast') : t('step.pointTwo');
  }
  return t('step.take');
};

export const TakeAndPoint = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    roleLabels: [t => t('take-and-point:role.pointFirst'), t => t('take-and-point:role.takeFirst')],
    getPlayerStepDescription: ({ board }) => <StepDescription board={board} />
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
