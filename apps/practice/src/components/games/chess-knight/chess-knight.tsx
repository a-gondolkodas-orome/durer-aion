import { range, some, isEqual, cloneDeep } from 'lodash';
import { strategyGameFactory, type BoardClientProps, type Events, GameBoard } from '../../game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { getAllowedMoves, generateStartBoard, markVisitedFields, type Board, type Field } from './helpers';
import { ChessKnightSvg } from './chess-knight-svg';

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const clickField = (field: Field) => {
    if (!isMoveAllowed(field)) return;

    moves.moveKnight(board, field);
  };
  const isMoveAllowed = (targetField: Field) => {
    if (!ctx.isClientMoveAllowed) return false;
    return some(getAllowedMoves(board), field => isEqual(field, targetField));
  };

  return (
  <GameBoard>
    <ChessKnightSvg />
    <table className="border-collapse w-full table-fixed">
      <tbody>
        {range(4).map(row => (
          <tr key={row}>
            {range(4).map(col => (
              <td
                key={col}
                className={`border-4 ${board.chessBoard[row][col] === 'visited' ? 'bg-slate-300' : ''}`}
              >
                <button
                  className="w-full aspect-square p-[5%]"
                  disabled={!isMoveAllowed({ row, col })}
                  onClick={() => clickField({ row, col })}
                >
                  {isMoveAllowed({ row, col }) && (
                    <svg className="w-full aspect-square opacity-25">
                      <use xlinkHref="#game-chess-knight" />
                    </svg>
                  )}
                  {board.chessBoard[row][col] === 'knight' && (
                    <svg className="w-full aspect-square">
                      <use xlinkHref="#game-chess-knight" />
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
  moveKnight: (board: Board, { events }: { events: Events }, { row, col }: Field) => {
    const nextBoard = cloneDeep(board);
    markVisitedFields(nextBoard, nextBoard.knightPosition);

    nextBoard.chessBoard[row][col] = 'knight';
    nextBoard.knightPosition = { row, col };

    events.endTurn();
    if (getAllowedMoves(nextBoard).length === 0) {
      events.endGame();
    }
    return { nextBoard };
  }
};

const rule = {
  hu: <>
    Egy 4 × 4-es tábla egyik mezőjén kezdetben egy huszár áll. Két játékos felváltva
    lép a huszárral. Nem szabad olyan mezőre lépni, amelyen korábban már járt a huszár,
    így a kezdőmezőre sem. Az veszít, aki nem tud lépni.
  </>,
  en: <>
    A knight is placed on one square of a 4 × 4 board. Two players take turns moving the knight.
    The knight may not move to any square it has already visited, including the starting square.
    The player who cannot move loses.
  </>
};

export const ChessKnight = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription: () => ({
      hu: 'Lépj egy szabad mezőre a huszárral.',
      en: 'Move the knight to a free square.'
    })
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt 🤖', en: 'Test 🤖' } },
    // smart bot: verified as optimal
    { botStrategy: smartBotStrategy, generateStartBoard, label: { hu: 'Okos 🤖', en: 'Smart 🤖' }, isDefault: true }
  ]
});
