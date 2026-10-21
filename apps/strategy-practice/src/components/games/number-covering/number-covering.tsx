import {
  strategyGameFactory, type BoardClientProps, GameBoard, testVariantLabel
} from 'strategy-game-factory';
import { range, sum } from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { generateTestStartBoard, getRemaining, moves, type Board, COVERED } from './gameplay';
import { randomBotStrategy, smartBotStrategy } from './bot-strategy';

const BoardClient = ({ board, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation('number-covering');


  return (
    <GameBoard>
      <div className="flex flex-wrap gap-1">
      {range(board.length).map(i => (
        <button
          key={i}
          disabled={!moves.coverNumber.isAllowed(board, i + 1)}
          className={`secondary-button w-auto text-2xl min-w-[3ch]`}
          onClick={() => moves.coverNumber(board, i + 1)}
        >
          {board[i] === COVERED ? 'X' : board[i]}
        </button>
      ))}
      </div>
      <p className="mt-2">
        {t('board.remainingSum')}
        : {sum(getRemaining(board))}
      </p>
    </GameBoard>
  );
};

// Without `maxNumber`, the rule for a table of any length.
const Rule = ({ maxNumber }: { maxNumber?: number }) => {
  const { t } = useTranslation('number-covering');
  return maxNumber === undefined
    ? <Trans t={t} i18nKey="rule.generic" />
    : <Trans t={t} i18nKey="rule.upTo" values={{ maxNumber }} />;
};

const StepDescription = () => {
  const { t } = useTranslation('number-covering');
  return t('step');
};

export const NumberCovering = strategyGameFactory({
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
      startBoards: [range(1, 9)],
      rule: <Rule maxNumber={8} />,
      label: t => t('number-covering:variant.eight'),
      isDefault: true
    },
    {
      botStrategy: smartBotStrategy,
      startBoards: [range(1, 11)],
      rule: <Rule maxNumber={10} />,
      label: t => t('number-covering:variant.ten')
    }
  ]
});
