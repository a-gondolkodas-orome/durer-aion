import { Trans, useTranslation } from 'react-i18next';
import { strategyGameFactory, testVariantLabel, fullVariantLabel } from 'strategy-game-factory';
import { COEFS, moves, type Board } from './gameplay';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { BoardClient } from './board-client';

const Rule = () => {
  const { t } = useTranslation('polynomial-building');
  return <Trans t={t} i18nKey="rule" components={{ formula: <code className="whitespace-nowrap" /> }} />;
};

const StepDescription = ({ board }: { board: Board }) => {
  const { t } = useTranslation('polynomial-building');
  const remaining = COEFS.filter(coef => board[coef] === null);
  if (remaining.length === 1) return t('step.last', { coefs: remaining[0] });
  const coefs = `${remaining.slice(0, -1).join(', ')} ${t('step.or')} ${remaining[remaining.length - 1]}`;
  return t('step.oneOfRemaining', { coefs });
};

export const PolynomialBuilding = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    roleLabels: [
      t => t('polynomial-building:role.first'),
      t => t('polynomial-building:role.second')
    ],
    getPlayerStepDescription: ({ board }) => <StepDescription board={board} />
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
      startBoards: [{ a: null, b: null, c: null }],
      label: fullVariantLabel,
      isDefault: true
    }
  ]
});
