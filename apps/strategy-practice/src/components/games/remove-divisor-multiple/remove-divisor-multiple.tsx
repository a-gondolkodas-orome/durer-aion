import type { BoardClientProps, StrategyGameConfig } from 'strategy-engine';
import { GameBoard } from 'strategy-engine/react';
import { Trans, useTranslation } from 'react-i18next';
import { testVariantLabel, fullVariantLabel } from 'strategy-game-factory';
import { range } from 'lodash';
import { generateStartBoard, generateTestStartBoard, isAllowed, moves, type Board } from './gameplay';
import { randomBotStrategy, smartBotStrategy } from './bot-strategy';

const BoardClient = ({ board, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation('remove-divisor-multiple');
  // Two different questions: `isLegal` marks the numbers that could be removed
  // from this position — shown in blue whoever is on turn — while `isAllowed`
  // additionally requires that it is this client's move, and gates the buttons.
  const isLegal = (n: number) => isAllowed(board, n);

  const removeNumber = (n: number) => moves.removeNumber(board, n);

  return (
    <GameBoard>
      <div>
        {range(1, board.numbersOnTable.length + 1).map(num =>
          <button
            key={num}
            disabled={!moves.removeNumber.isAllowed(board, num)}
            onClick={() => removeNumber(num)}
            className={`
              m-1 min-h-28 w-18 border-4 rounded-lg shadow-md text-4xl font-bold
              ${board.numbersOnTable[num - 1] ? '' : 'opacity-50 border-dashed'}
              ${board.numbersOnTable[num - 1] ? (isLegal(num) ? 'border-blue-600' : 'border-red-600') : ''}
              enabled:hocus:opacity-50 enabled:hocus:border-dashed
              `}
          >
            {num}
          </button>
        )}
      </div>
      <p className="text-2xl mt-2">
        {t('board.previousMove')}: {board.previousMove === null ? '-' : board.previousMove}
      </p>
    </GameBoard>
  )
};

const Rule = () => {
  const { t } = useTranslation('remove-divisor-multiple');
  return <Trans t={t} i18nKey="rule" />;
};

const StepDescription = () => {
  const { t } = useTranslation('remove-divisor-multiple');
  return t('step');
};

export const removeDivisorMultipleConfig: StrategyGameConfig<Board> = {
  presentation: {
    rule: <Rule />,
    getPlayerStepDescription: () => <StepDescription />
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
      generateStartBoard,
      label: fullVariantLabel,
      isDefault: true
    }
  ]
};
