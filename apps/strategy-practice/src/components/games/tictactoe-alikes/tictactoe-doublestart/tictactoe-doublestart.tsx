import { Trans, useTranslation } from 'react-i18next';
import { strategyGameFactory, testVariantLabel, fullVariantLabel } from 'strategy-game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { generateEmptyTicTacToeBoard } from '../gameplay';
import { BoardClient } from '../board-client';
import { isDuringFirstMove, moves, type Board } from './gameplay';

const StepDescription = ({ board }: { board: Board }) => {
  const { t } = useTranslation('tictactoe-alikes');
  return isDuringFirstMove(board) ? t('ticTacToeDoubleStart.step.first') : t('ticTacToeDoubleStart.step.next');
};

const Rule = () => {
  const { t } = useTranslation('tictactoe-alikes');
  return <Trans t={t} i18nKey="ticTacToeDoubleStart.rule" />;
};

export const TicTacToeDoubleStart = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    getPlayerStepDescription: ({ board }) => <StepDescription board={board} />
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: testVariantLabel },
    {
      botStrategy: smartBotStrategy,
      startBoards: [generateEmptyTicTacToeBoard()],
      label: fullVariantLabel,
      isDefault: true
    }
  ]
});
