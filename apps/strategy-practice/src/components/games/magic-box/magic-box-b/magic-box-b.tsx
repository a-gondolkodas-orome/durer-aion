import { Trans, useTranslation } from 'react-i18next';
import { strategyGameFactory, testVariantLabel, fullVariantLabel } from 'strategy-game-factory';
import { BoardClient } from './board-client';
import { generateEmptyBoard, moves, type Board } from './gameplay';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';

const Rule = () => {
  const { t } = useTranslation('magic-box');
  return <Trans t={t} i18nKey="rule.b" />;
};

const StepDescription = ({ board }: { board: Board }) => {
  const { t } = useTranslation('magic-box');
  return board.pendingLine === null ? t('step.b.designate') : t('step.b.place');
};

export const MagicBoxB = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    // The engine always seats player 0 first, but here it is the *second*
    // player who opens (with a line designation), so the roles are labelled the
    // other way round rather than the seating being changed.
    roleLabels: [
      t => t('magic-box:role.placeSecond'),
      t => t('magic-box:role.placeFirst')
    ],
    getPlayerStepDescription: ({ board }) => <StepDescription board={board} />
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: testVariantLabel },
    {
      botStrategy: smartBotStrategy,
      startBoards: [generateEmptyBoard()],
      label: fullVariantLabel,
      isDefault: true
    }
  ]
});
