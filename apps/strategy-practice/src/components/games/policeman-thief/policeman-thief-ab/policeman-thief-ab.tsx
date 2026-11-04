import { Trans, useTranslation } from 'react-i18next';
import { strategyGameFactory, type Ctx } from 'strategy-game-factory';
import { POLICE, generateStartBoardA, generateStartBoardB, moves, type Board } from './gameplay';
import { smartBotStrategy } from './bot-strategy';
import { BoardClient } from './board-client';

const Rule = ({ variant }: { variant: 'a' | 'b' }) => {
  const { t } = useTranslation('policeman-thief');
  return variant === 'a' ? <Trans t={t} i18nKey="rule.a" /> : <Trans t={t} i18nKey="rule.b" />;
};

const StepDescription = ({ board, ctx }: { board: Board; ctx: Ctx }) => {
  const { t } = useTranslation('policeman-thief');
  if (ctx.currentPlayer !== POLICE) return t('step.ab.thief');
  return board.firstPolicemanMoved ? t('step.ab.greenPoliceman') : t('step.ab.bluePoliceman');
};

// A and B are the same game; they differ only in the start position (in A the two
// policemen always start on the same intersection, in B they may start apart) and
// the corresponding rule wording. Exposed as two variants of one game.
export const Policemanthief = strategyGameFactory({
  presentation: {
    rule: <Rule variant="a" />,
    roleLabels: [t => t('policeman-thief:role.police'), t => t('policeman-thief:role.thief')],
    getPlayerStepDescription: ({ board, ctx }) => <StepDescription board={board} ctx={ctx} />
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: smartBotStrategy,
      generateStartBoard: generateStartBoardA,
      label: t => t('policeman-thief:variant.together'),
      isDefault: true
    },
    {
      botStrategy: smartBotStrategy,
      generateStartBoard: generateStartBoardB,
      rule: <Rule variant="b" />,
      label: t => t('policeman-thief:variant.apart')
    }
  ]
});
