import { useTranslation } from 'react-i18next';
import { strategyGameFactory } from 'strategy-game-factory';
import { startBoard, moves } from './gameplay';
import { smartBotStrategy } from './bot-strategy';
import { BoardClient } from './board-client';

const Rule = () => {
  const { t } = useTranslation('amor-and-cupido');
  return t('rule');
};

const StepDescription = () => {
  const { t } = useTranslation('amor-and-cupido');
  return t('step');
};

export const AmorAndCupido = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    getPlayerStepDescription: () => <StepDescription />
  },
  BoardClient,
  gameplay: { moves },
  variants: [{
    botStrategy: smartBotStrategy,
    startBoards: [startBoard]
  }]
});
