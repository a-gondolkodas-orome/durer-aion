import { Trans, useTranslation } from 'react-i18next';
import {
  strategyGameFactory, testVariantLabel, fullVariantLabel, type BoardClientProps, GameBoard
} from 'strategy-game-factory';
import { range } from 'lodash';
import { randomBotStrategy, smartBotStrategy } from './bot-strategy';
import { generateStartBoard, isRobbable, moves, type Board } from './gameplay';

const BoardClient = ({ board, moves }: BoardClientProps<Board>) => {
  const getCoords = (index: number) => {
    const step = Math.PI * 2 / board.circle.length;
    const angle = index * step + (board.firstMove === null ? 0 : board.firstMove * step);
    return { x: 55 + 50 * Math.cos(angle), y: 55 + 50 * Math.sin(angle) };
  };

  // Two different questions: `isAllowedBank` marks the banks that could be
  // robbed from this position — shown in green whoever is on turn — while
  // `isAllowedMove` additionally requires that it is this client's move.
  const isAllowedMove = (index: number) => moves.rob.isAllowed(board, index);

  const isAllowedBank = (index: number) => isRobbable(board, index);

  const getBankColor = (index: number) => {
    if (index === board.lastMove) return 'fill-red-800 stroke-red-600';
    if (board.circle[index] === false) return 'fill-red-800';
    if (!isAllowedBank(index)) return 'fill-slate-400';
    return 'fill-green-600';
  }

  return (
    <GameBoard>
      <svg width="100%" height="100%" viewBox='0 0 110 110'>
        {range(board.circle.length).map(index => {
          const { x, y } = getCoords(index);
          const prev = getCoords(index - 1);
          return (
            <line
              key={index}
              className="stroke-slate-600"
              x1={x} y1={y}
              x2={prev.x} y2={prev.y}
              strokeWidth={1.5}
            />
          );
        })}
        {range(board.circle.length).map(index => {
          const { x, y } = getCoords(index);
          return (
            <circle
              key={index}
              cx={x} cy={y}
              r="4%"
              className={`${getBankColor(index)}`}
              strokeWidth={index === board.lastMove ? '1%' : '0'}
              onClick={() => moves.rob(board, index)}
              onKeyUp={(event) => {
                if (event.key === 'Enter') moves.rob(board, index);
              }}
              tabIndex={isAllowedMove(index) ? 0 : undefined}
              role={isAllowedMove(index) ? 'button' : undefined}
              aria-label={isAllowedMove(index) ? `Bank ${index + 1}` : undefined}
            />
          );
        })}
      </svg>
    </GameBoard>
  );
};

const Rule = () => {
  const { t } = useTranslation('bank-robbers');
  return <Trans t={t} i18nKey="rule" />;
};

const StepDescription = () => {
  const { t } = useTranslation('bank-robbers');
  return t('step');
};

export const BankRobbers = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    getPlayerStepDescription: () => <StepDescription />
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: testVariantLabel },
    { botStrategy: smartBotStrategy, generateStartBoard, label: fullVariantLabel, isDefault: true }
  ]
});
