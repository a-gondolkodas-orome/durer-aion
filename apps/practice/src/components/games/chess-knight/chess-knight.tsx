import { range, some, isEqual, cloneDeep } from 'lodash';
import {
  strategyGameFactory, type BoardClientProps, type Ctx, type MoveOutcome, GameBoard
} from '../../strategy-game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { getAllowedMoves, generateStartBoard, markVisitedFields, type Board, type Field } from './helpers';
import { ChessKnightSvg } from './chess-knight-svg';

const BoardClient = ({ board, moves }: BoardClientProps<Board>) => {
  const isMoveAllowed = (targetField: Field) => moves.moveKnight.isAllowed(board, targetField);

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
                className={`border-4 ${
                  board.chessBoard[row][col] === 'visited' ? 'bg-slate-900/40 dark:bg-white/20' : ''
                }`}
              >
                <button
                  className="w-full aspect-square p-[5%]"
                  disabled={!isMoveAllowed({ row, col })}
                  onClick={() => moves.moveKnight(board, { row, col })}
                >
                  {isMoveAllowed({ row, col }) && (
                    <svg className="w-full aspect-square opacity-20">
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

export const moves = {
  moveKnight: {
    validate: (board: Board, _, target: Field) =>
      some(getAllowedMoves(board), field => isEqual(field, target)),
    apply: (board: Board, { ctx }: { ctx: Ctx }, { row, col }: Field): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      markVisitedFields(nextBoard, nextBoard.knightPosition);

      nextBoard.chessBoard[row][col] = 'knight';
      nextBoard.knightPosition = { row, col };

      if (getAllowedMoves(nextBoard).length === 0) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;

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
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt', en: 'Test' } },
    // smart bot: verified as optimal
    { botStrategy: smartBotStrategy, generateStartBoard, label: { hu: 'Teljes', en: 'Full' }, isDefault: true }
  ]
});
