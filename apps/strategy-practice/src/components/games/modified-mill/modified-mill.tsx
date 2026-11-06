import { Trans, useTranslation } from 'react-i18next';
import { strategyGameFactory, testVariantLabel, fullVariantLabel } from 'strategy-game-factory';
import { generateEmptyBoard, moves, type Board } from './gameplay';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { BoardClient } from './board-client';

export type { Board };

const Rule = () => {
  const { t } = useTranslation('modified-mill');
  return <Trans t={t} i18nKey="rule" />;
};

const StepDescription = () => {
  const { t } = useTranslation('modified-mill');
  return t('step');
};

export const ModifiedMill = strategyGameFactory({
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
      // First player follows the exhaustively verified winning strategy; as the
      // second player (the losing side) it plays best-effort and may not always
      // punish a mistake — hence notAlwaysOptimal.
      botStrategy: smartBotStrategy,
      startBoards: [generateEmptyBoard()],
      label: fullVariantLabel,
      isDefault: true,
      notAlwaysOptimal: true
    }
  ]
});
