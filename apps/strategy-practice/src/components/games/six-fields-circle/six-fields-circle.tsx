import { Trans, useTranslation } from 'react-i18next';
import { strategyGameFactory, testVariantLabel, fullVariantLabel, type StrategyArgs } from 'strategy-game-factory';
import { generateStartBoard, moves, type Board, type TurnState } from './gameplay';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { BoardClient } from './board-client';

export type { Board };

const StepDescription = ({ ctx }: Pick<StrategyArgs<Board, TurnState>, 'ctx'>) => {
  const { t } = useTranslation('six-fields-circle');
  return ctx.turnState !== null ? t('step.second') : t('step.first');
};

const Rule = () => {
  const { t } = useTranslation('six-fields-circle');
  return <Trans t={t} i18nKey="rule" />;
};

export const SixFieldsCircle = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    getPlayerStepDescription: ({ ctx }) => <StepDescription ctx={ctx} />
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
      generateStartBoard,
      label: fullVariantLabel,
      isDefault: true
    }
  ]
});
