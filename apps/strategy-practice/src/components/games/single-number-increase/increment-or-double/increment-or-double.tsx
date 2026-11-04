import { Trans, useTranslation } from 'react-i18next';
import { strategyGameFactory, type BoardClientProps, GameBoard } from 'strategy-game-factory';
import { isLosing, moves, target, type Board } from './gameplay';
import { smartBotStrategy } from './bot-strategy';

const BoardClient = ({ board, moves }: BoardClientProps<Board>) => {
  const incResult = board + 1;
  const dblResult = board * 2;

  const actionButton = (
    label: string, result: number, onClick: () => void, disabled: boolean
  ) => (
    <button
      className={`primary-button w-auto grow ${isLosing(result) ? 'bg-red-600 hocus:bg-red-500' : ''}`}
      disabled={disabled}
      onClick={onClick}
    >{label} → {result}</button>
  );

  return (
    <GameBoard>
      <h2 className="text-center text-5xl font-bold my-4">{board}</h2>
      <div className="flex flex-wrap gap-2">
        {actionButton('x+1', incResult, () => moves.increment(board), !moves.increment.isAllowed(board))}
        {actionButton('2x', dblResult, () => moves.double(board), !moves.double.isAllowed(board))}
      </div>
    </GameBoard>
  );
};

const Rule = () => {
  const { t } = useTranslation('single-number-increase');
  return <Trans t={t} i18nKey="incrementOrDouble.rule" values={{ target }} />;
};

const StepDescription = ({ board }: { board: Board }) => {
  const { t } = useTranslation('single-number-increase');
  return board === 0 ? t('incrementOrDouble.step.first') : t('incrementOrDouble.step.next');
};

export const IncrementOrDouble = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    getPlayerStepDescription: ({ board }) => <StepDescription board={board} />
  },
  BoardClient,
  gameplay: { moves },
  variants: [{ botStrategy: smartBotStrategy, startBoards: [0] }]
});
