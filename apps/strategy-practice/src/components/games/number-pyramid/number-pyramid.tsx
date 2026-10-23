import { Trans, useTranslation } from 'react-i18next';
import { strategyGameFactory, testVariantLabel, fullVariantLabel } from 'strategy-game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { generateStartBoard, moves, type TurnState } from './gameplay';
import { BoardClient } from './board-client';

const Rule = () => {
  const { t } = useTranslation('number-pyramid');
  return <Trans t={t} i18nKey="rule" />;
};

const StepDescription = ({ turnState }: { turnState: TurnState | null }) => {
  const { t } = useTranslation('number-pyramid');
  if (turnState) return t('step.second', { level: turnState.levelIdx + 1 });
  return t('step.first');
};

export const NumberPyramid = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    getPlayerStepDescription: ({ ctx }) => <StepDescription turnState={ctx.turnState} />
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
