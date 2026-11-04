import { Trans, useTranslation } from 'react-i18next';
import { strategyGameFactory, testVariantLabel, fullVariantLabel } from 'strategy-game-factory';
import { generateEmptyTicTacToeBoard } from '../gameplay';
import { BoardClient } from '../board-client';
import { moves } from './gameplay';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';

const Rule = () => {
  const { t } = useTranslation('tictactoe-alikes');
  return <Trans t={t} i18nKey="antiTicTacToe.rule" />;
};

const StepDescription = () => {
  const { t } = useTranslation('tictactoe-alikes');
  return t('antiTicTacToe.step');
};

export const AntiTicTacToe = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    getPlayerStepDescription: () => <StepDescription />
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: testVariantLabel },
    {
      botStrategy: smartBotStrategy,
      startBoards: [generateEmptyTicTacToeBoard()],
      label: fullVariantLabel,
      isDefault: true
    }
  ]
});
