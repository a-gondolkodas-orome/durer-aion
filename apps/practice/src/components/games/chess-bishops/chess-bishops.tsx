import { range, some, isEqual, cloneDeep } from 'lodash';
import {
  strategyGameFactory, type BoardClientProps, type Events, GameBoard, useHoverPreview
} from '../../strategy-game-factory';
import { ChessBishopSvg } from './chess-bishop-svg';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import {
  generateStartBoard, getAllowedMoves, BISHOP, FORBIDDEN, markForbiddenFields,
  type Board, type Field
} from './helpers';

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { value: validHoveredField, hoverProps } = useHoverPreview<Field>(ctx.moveCount);

  const isPotentialNextStep = (field: Field) => {
    if (!isMoveAllowed(field)) return false;
    if (!validHoveredField) return false;
    return isEqual(validHoveredField, field);
  };
  const isMoveAllowed = (targetField: Field) => moves.placeBishop.isAllowed!(board, targetField);
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

const moves = {
  placeBishop: {
    validate: (board: Board, _, target: Field) =>
      some(getAllowedMoves(board), field => isEqual(field, target)),
    apply: (board: Board, { events }: { events: Events }, { row, col }: Field) => {
      const nextBoard = cloneDeep(board);
      markForbiddenFields(nextBoard, { row, col });
      nextBoard[row][col] = BISHOP;
      events.endTurn();
      if (getAllowedMoves(nextBoard).length === 0) {
        events.endGame();
      }
      return { nextBoard };
    }
  }
};

const rule = {
  hu: <>
    Két játékos felváltva tesz le a sakktáblára futókat. Egy új futót mindig
    csak olyan mezőre tehetünk, amin még nem áll futó, és azt a mezőt nem is támadja futó. Az
    veszít, aki nem tud lerakni futót.
  </>,
  en: <>
    Two players take turns placing bishops on a chessboard. A new bishop may only be placed on a
    square that is not already occupied by a bishop and is not attacked by any bishop. The player
    who cannot place a bishop loses.
  </>
};

export const ChessBishops = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription: () => ({
      hu: 'Kattints egy mezőre, amit nem üt egyik futó sem.',
      en: 'Click on a square that is not attacked by any bishop.'
    })
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt', en: 'Test' } },
    // smart bot: verified as optimal
    { botStrategy: smartBotStrategy, generateStartBoard, label: { hu: 'Teljes', en: 'Full' }, isDefault: true }
  ]
});
