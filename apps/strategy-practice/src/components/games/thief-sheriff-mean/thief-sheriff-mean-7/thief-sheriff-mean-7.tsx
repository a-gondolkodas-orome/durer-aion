import { Trans, useTranslation } from 'react-i18next';
import { strategyGameFactory, testVariantLabel, fullVariantLabel } from 'strategy-game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { startBoard } from '../gameplay';
import { makeBoardClient } from '../board-client';
import { moves, CARD_COUNT } from './gameplay';

const BoardClient = makeBoardClient(CARD_COUNT);

const Rule = () => {
  const { t } = useTranslation('thief-sheriff-mean');
  return <Trans t={t} i18nKey="rule.seven" values={{ cardCount: CARD_COUNT }} />;
};

const StepDescription = () => {
  const { t } = useTranslation('thief-sheriff-mean');
  return t('step');
};

export const ThiefSheriffMean7 = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    roleLabels: [t => t('thief-sheriff-mean:role.sheriff'), t => t('thief-sheriff-mean:role.thief')],
    getPlayerStepDescription: () => <StepDescription />
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: testVariantLabel },
    { botStrategy: smartBotStrategy, startBoards: [startBoard], label: fullVariantLabel, isDefault: true }
  ]
});
