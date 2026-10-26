import { Trans, useTranslation } from 'react-i18next';
import { strategyGameFactory, testVariantLabel, fullVariantLabel } from 'strategy-game-factory';
import { moves, type Board } from './gameplay';
import { randomBotStrategy, smartBotStrategy } from './bot-strategy';
import { BoardClient } from './board-client';

export type { Board };

const Rule = () => {
  const { t } = useTranslation('four-connected-fields');
  return <Trans t={t} i18nKey="rule" />;
};

const StepDescription = () => {
  const { t } = useTranslation('four-connected-fields');
  return t('step');
};

export const FourConnectedFields = strategyGameFactory({
  presentation: {
    rule: <Rule />,
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
      startBoards: [[0, 0, 0, 0]],
      label: fullVariantLabel,
      isDefault: true
    }
  ]
});
