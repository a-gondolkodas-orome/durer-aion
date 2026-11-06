import { Trans, useTranslation } from 'react-i18next';
import { strategyGameFactory, testVariantLabel, fullVariantLabel, type Ctx } from 'strategy-game-factory';
import { BoardClient } from './board-client';
import { LINE, startBoard, moves } from './gameplay';
import { smartBotStrategy, randomBotStrategy } from './strategy/bot-strategy';

const Rule = () => {
  const { t } = useTranslation('triangle-circle-game');
  return <Trans t={t} i18nKey="rule" />;
};

const StepDescription = ({ ctx }: { ctx: Ctx }) => {
  const { t } = useTranslation('triangle-circle-game');
  return ctx.currentPlayer === LINE ? t('step.line') : t('step.circle');
};

export const TriangleCircleGame = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    roleLabels: [t => t('triangle-circle-game:role.line'), t => t('triangle-circle-game:role.circle')],
    getPlayerStepDescription: ({ ctx }) => <StepDescription ctx={ctx} />
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      startBoards: [startBoard],
      label: testVariantLabel
    },
    // Smart bot. As the line player it executes a proven forced win (see
    // forced-win.ts and the certificate in forced-win.test.ts) — the line
    // player wins this board with perfect play. As the circle player no
    // winning strategy exists; it defends as well as possible (two-hot safety
    // filter + bounded search), hence the notAlwaysOptimal marker.
    {
      botStrategy: smartBotStrategy,
      startBoards: [startBoard],
      label: fullVariantLabel,
      notAlwaysOptimal: true,
      isDefault: true
    }
  ]
});
