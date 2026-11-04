import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { strategyGameFactory, testVariantLabel, fullVariantLabel, type StrategyArgs } from 'strategy-game-factory';
import { BoardClient } from './board-client';
import { randomBotStrategy, smartBotStrategy } from './bot-strategy';
import { markOf, moves, startBoardOFirst, startBoardXFirst, type Board, type TurnState } from './gameplay';

const RuleXFirst = () => {
  const { t } = useTranslation('two-xs-one-o');
  return t('rule.xFirst');
};

const RuleOFirst = () => {
  const { t } = useTranslation('two-xs-one-o');
  return t('rule.oFirst');
};

const StepDescription = ({ board, ctx }: Pick<StrategyArgs<Board, TurnState>, 'board' | 'ctx'>) => {
  const { t } = useTranslation('two-xs-one-o');
  if (markOf(board, ctx.currentPlayer!) === 'O') return t('step.o');
  return ctx.turnState?.xsPlaced === 1 ? t('step.secondX') : t('step.firstX');
};

const makeGame = (rule: ReactNode, startBoard: Board) => strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription: ({ board, ctx }) => <StepDescription board={board} ctx={ctx} />
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: testVariantLabel },
    {
      botStrategy: smartBotStrategy,
      startBoards: [startBoard],
      label: fullVariantLabel,
      isDefault: true
    }
  ]
});

export const TwoXsOneO = makeGame(<RuleXFirst />, startBoardXFirst);
export const TwoXsOneODE = makeGame(<RuleOFirst />, startBoardOFirst);
