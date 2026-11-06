import { range, isEqual } from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import {
  strategyGameFactory, type BoardClientProps, GameBoard, testVariantLabel, fullVariantLabel
} from 'strategy-game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { boardSize, generateStartBoard, isTarget, moves, type Board, type Field } from './gameplay';
import { RookSvg } from '../shared/rook-svg';

const BoardClient = ({ board, moves }: BoardClientProps<Board>) => {
  const isMoveAllowed = (targetField: Field) => moves.moveRook.isAllowed(board, targetField);

  return (
  <GameBoard>
    <RookSvg id="game-rook-to-corner" />
    <table className="border-collapse w-full table-fixed">
      <tbody>
        {range(boardSize).map(row => (
          <tr key={row}>
            {range(boardSize).map(col => {
              const hasRook = isEqual(board.rookPosition, { row, col });
              const isGoal = isTarget({ row, col });
              return (
                <td key={col} className="border-4">
                  <button
                    className="w-full aspect-square p-[5%]"
                    disabled={!isMoveAllowed({ row, col })}
                    onClick={() => moves.moveRook(board, { row, col })}
                  >
                    {isGoal && !hasRook && (
                      <span className="flex items-center justify-center w-full aspect-square text-3xl sm:text-4xl">
                        🏁
                      </span>
                    )}
                    {isMoveAllowed({ row, col }) && !isGoal && (
                      <svg className="w-full aspect-square opacity-20">
                        <use xlinkHref="#game-rook-to-corner" />
                      </svg>
                    )}
                    {hasRook && (
                      <svg className="w-full aspect-square">
                        <use xlinkHref="#game-rook-to-corner" />
                      </svg>
                    )}
                  </button>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </GameBoard>
  );
};

const Rule = () => {
  const { t } = useTranslation('rook-to-corner');
  return <Trans t={t} i18nKey="rule" />;
};

const StepDescription = () => {
  const { t } = useTranslation('rook-to-corner');
  return t('step');
};

export const RookToCorner = strategyGameFactory({
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
