import { sample } from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { strategyGameFactory, testVariantLabel } from 'strategy-game-factory';
import { BoardClient, StepDescription } from './board-client';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { moves } from './gameplay';
import { generateStartBoard as generateSingleBoard } from './single/gameplay';
import { generateStartBoard as generateMultipleBoard } from './multiple/gameplay';

const Rule = ({ variant }: { variant: 'generic' | 'single' | 'multiple' }) => {
  const { t } = useTranslation('remove-row-or-column');
  if (variant === 'single') return <Trans t={t} i18nKey="rule.single" />;
  if (variant === 'multiple') return <Trans t={t} i18nKey="rule.multiple" />;
  return <Trans t={t} i18nKey="rule.generic" />;
};

// Test variant covers both sub-games: a single rectangle or several rectangles.
const generateTestStartBoard = () => sample([generateSingleBoard, generateMultipleBoard])();

export const RemoveRowOrColumn = strategyGameFactory({
  presentation: {
    rule: <Rule variant="generic" />,
    getPlayerStepDescription: ({ ctx }) => <StepDescription ctx={ctx} />
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      generateStartBoard: generateTestStartBoard,
      label: testVariantLabel
    },
    {
      botStrategy: smartBotStrategy,
      generateStartBoard: generateSingleBoard,
      rule: <Rule variant="single" />,
      label: t => t('remove-row-or-column:variant.single'),
      isDefault: true
    },
    {
      botStrategy: smartBotStrategy,
      generateStartBoard: generateMultipleBoard,
      rule: <Rule variant="multiple" />,
      label: t => t('remove-row-or-column:variant.multiple')
    }
  ]
});
