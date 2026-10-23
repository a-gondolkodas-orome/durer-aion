import {
  strategyGameFactory, type BoardClientProps, GameBoard, testVariantLabel, fullVariantLabel
} from 'strategy-game-factory';
import { Trans, useTranslation } from 'react-i18next';
import { generateStartBoard, generateTestStartBoard, moves, type Board } from './gameplay';
import { randomBotStrategy, smartBotStrategy } from './bot-strategy';

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation('pairs-of-numbers');
  return (
    <GameBoard>
      <p className='text-4xl font-bold text-center mb-2'>
        <code>({board[0]},{board[1]})</code>
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          className="primary-button w-auto grow"
          disabled={!ctx.isClientMoveAllowed}
          onClick={() => moves.add1(board)}
        >
          {t('board.increase')} {ctx.isClientMoveAllowed && <>
            (→<code>({board[0]},{board[1] + 1})</code>)
          </>}
        </button>
        <button
          className="primary-button w-auto grow"
          disabled={!ctx.isClientMoveAllowed}
          onClick={() => moves.subtract(board)}
        >
          {t('board.subtract')} {ctx.isClientMoveAllowed && <>
            (→<code>({board[0] - board[1]},{board[1]})</code>)
          </>}
        </button>
      </div>
    </GameBoard>
  );
};

const Rule = () => {
  const { t } = useTranslation('pairs-of-numbers');
  return <Trans t={t} i18nKey="rule" components={{ formula: <code className="whitespace-nowrap" /> }} />;
};

const StepDescription = () => {
  const { t } = useTranslation('pairs-of-numbers');
  return t('step');
};

export const PairsOfNumbers = strategyGameFactory({
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
});
