import { Trans, useTranslation } from 'react-i18next';
import { strategyGameFactory, testVariantLabel, fullVariantLabel } from 'strategy-game-factory';
import { BoardClient } from '../board-client';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { generateStartBoard, moves } from './gameplay';

const Rule = () => {
  const { t } = useTranslation('pile-splitting-games');
  return <Trans t={t} i18nKey="rule.three" />;
};

const StepDescription = () => {
  const { t } = useTranslation('pile-splitting-games');
  return t('step.three');
};

export const PileSplitter3 = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    getPlayerStepDescription: () => <StepDescription />
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: testVariantLabel },
    { botStrategy: smartBotStrategy, generateStartBoard, label: fullVariantLabel, isDefault: true }
  ]
});
