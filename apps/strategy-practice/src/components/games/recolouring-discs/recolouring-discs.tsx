import { Trans, useTranslation } from 'react-i18next';
import { strategyGameFactory, testVariantLabel, fullVariantLabel, type Ctx } from 'strategy-game-factory';
import { BoardClient } from './board-client';
import { PLY_CAP, RED, countColor, generateStartBoard, moves, targetCounts, type Board } from './gameplay';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';

const Rule = () => {
  const { t } = useTranslation('recolouring-discs');
  return <Trans t={t} i18nKey="rule" />;
};

const StepDescription = ({ board, ctx }: { board: Board; ctx: Ctx }) => {
  const { t } = useTranslation('recolouring-discs');
  const goal = targetCounts(board.cells.length);
  const isRed = ctx.currentPlayer === RED;
  const who = ctx.isHumanVsHumanGame
    ? (isRed ? t('step.who.redToMove') : t('step.who.blueToMove'))
    : (isRed ? t('step.who.youAreRed') : t('step.who.youAreBlue'));
  return t('step.text', {
    who,
    red: countColor(board.cells, 'red'),
    redGoal: goal.red,
    blue: countColor(board.cells, 'blue'),
    blueGoal: goal.blue,
    move: ctx.moveCount + 1, // the move about to be made
    plyCap: PLY_CAP
  });
};

export const RecolouringDiscs = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    getPlayerStepDescription: ({ board, ctx }) => <StepDescription board={board} ctx={ctx} />
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
