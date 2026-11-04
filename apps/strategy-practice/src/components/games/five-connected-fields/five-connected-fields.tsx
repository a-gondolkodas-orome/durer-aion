import { Trans, useTranslation } from 'react-i18next';
import { strategyGameFactory } from 'strategy-game-factory';
import { startBoard, moves } from './gameplay';
import { smartBotStrategy } from './bot-strategy';
import { BoardClient } from './board-client';

const Rule = () => {
  const { t } = useTranslation('five-connected-fields');
  return <Trans t={t} i18nKey="rule" />;
};

const StepDescription = () => {
  const { t } = useTranslation('five-connected-fields');
  return t('step');
};

export const FiveConnectedFields = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    getPlayerStepDescription: () => <StepDescription />
  },
  BoardClient,
  gameplay: { moves },
  variants: [{ botStrategy: smartBotStrategy, startBoards: [startBoard] }]
});
