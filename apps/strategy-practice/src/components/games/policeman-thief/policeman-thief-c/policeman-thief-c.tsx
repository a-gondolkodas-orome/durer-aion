
import { Trans, useTranslation } from 'react-i18next';
import { strategyGameFactory, type Ctx, testVariantLabel, fullVariantLabel } from 'strategy-game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { POLICE, generateStartBoard, moves, type Board } from './gameplay';
import { BoardClient } from './board-client';

const Rule = () => {
  const { t } = useTranslation('policeman-thief');
  return <Trans t={t} i18nKey="rule.c" />;
};

const StepDescription = ({ board, ctx }: { board: Board; ctx: Ctx }) => {
  const { t } = useTranslation('policeman-thief');
  const copColour = [t('colour.blue'), t('colour.green'), t('colour.amber')];
  if (board.phase === 'placingCops') {
    const n = board.policemen.length + 1;
    return t('step.c.placeCop', { n, colour: copColour[n - 1] });
  }
  if (board.phase === 'placingThief') return t('step.c.placeThief');
  // chasing
  if (ctx.currentPlayer === POLICE) return t('step.c.moveCop', { colour: copColour[board.copCursor] });
  return t('step.c.moveThief', { remaining: 3 - board.thiefMoveCount });
};

export const PolicemanthiefC = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    roleLabels: [t => t('policeman-thief:role.police'), t => t('policeman-thief:role.thief')],
    getPlayerStepDescription: ({ board, ctx }) => <StepDescription board={board} ctx={ctx} />
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      // Random bot: plays a random legal move, but grabs an immediate catch/escape
      // when one is available. Lets a human thief realistically win.
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
