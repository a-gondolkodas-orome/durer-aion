import { useTranslation } from 'react-i18next';
import { strategyGameFactory, testVariantLabel, fullVariantLabel } from 'strategy-game-factory';
import { BoardClient } from './board-client';
import { currentWindowSize, generateStartBoard, moves, type Board } from './gameplay';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';

// A plain string rather than <Trans>: the text's `<` signs are not markup.
const Rule = () => {
  const { t } = useTranslation('matches-on-edges');
  return t('rule');
};

const StepDescription = ({ board }: { board: Board }) => {
  const { t } = useTranslation('matches-on-edges');
  const k = currentWindowSize(board);
  if (k === null) return t('step.over');
  return t('step.move', { k });
};

export const MatchesOnEdges = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    roleLabels: [
      t => t('matches-on-edges:role.first'),
      t => t('matches-on-edges:role.second')
    ],
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
