import { Trans, useTranslation } from 'react-i18next';
import { range, isEqual } from 'lodash';
import {
  strategyGameFactory, testVariantLabel, fullVariantLabel, type BoardClientProps, GameBoard, useHoverPreview
} from 'strategy-game-factory';
import { ChessBishopSvg } from './chess-bishop-svg';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { BISHOP, FORBIDDEN, startBoard, moves, type Board, type Field } from './gameplay';

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { value: validHoveredField, hoverProps } = useHoverPreview<Field>(ctx.moveCount);

  const isPotentialNextStep = (field: Field) => {
    if (!isMoveAllowed(field)) return false;
    if (!validHoveredField) return false;
    return isEqual(validHoveredField, field);
  };
  const isMoveAllowed = (targetField: Field) => moves.placeBishop.isAllowed(board, targetField);
  const isForbidden = ({ row, col }: Field) => {
    return board[row][col] === FORBIDDEN;
  };
  const isBishop = ({ row, col }: Field) => {
    return board[row][col] === BISHOP;
  };
  const wouldBeForbidden = ({ row, col }: Field) => {
    if (!ctx.isClientMoveAllowed) return false;
    if (!validHoveredField) return false;
    if (!isMoveAllowed(validHoveredField)) return false;
    if (!isMoveAllowed({ row, col })) return false;
    if (isPotentialNextStep({ row, col })) return false;
    return Math.abs(row - validHoveredField.row) === Math.abs(col - validHoveredField.col);
  };

  return (
  <GameBoard>
    <ChessBishopSvg />
    <table className="w-full border-collapse table-fixed">
      <tbody>
        {range(8).map(row => (
          <tr key={row}>
            {range(8).map(col => (
              <td
                key={col}
                className={`
                  border-4 ${isForbidden({ row, col }) ? 'bg-slate-900/40 dark:bg-white/20' : ''}
                  ${wouldBeForbidden({ row, col }) ? 'bg-slate-900/20 dark:bg-white/10' : ''}
                `}
              >
                <button
                  className="w-full aspect-square p-[5%]"
                  disabled={!isMoveAllowed({ row, col })}
                  onClick={() => moves.placeBishop(board, { row, col })}
                  {...hoverProps({ row, col })}
                >
                  {isBishop({ row, col }) && (
                    <svg className="w-full aspect-square">
                      <use xlinkHref="#game-chess-bishop" />
                    </svg>
                  )}
                  {isPotentialNextStep({ row, col }) && (
                    <svg className="w-full aspect-square opacity-50">
                      <use xlinkHref="#game-chess-bishop" />
                    </svg>
                  )}
                </button>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </GameBoard>
  );
};

const Rule = () => {
  const { t } = useTranslation('chess-bishops');
  return <Trans t={t} i18nKey="rule" />;
};

const StepDescription = () => {
  const { t } = useTranslation('chess-bishops');
  return t('step');
};

export const ChessBishops = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    getPlayerStepDescription: () => <StepDescription />
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: testVariantLabel },
    { botStrategy: smartBotStrategy, startBoards: [startBoard], label: fullVariantLabel, isDefault: true }
  ]
});
