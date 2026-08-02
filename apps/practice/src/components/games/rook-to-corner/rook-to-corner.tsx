import { range, some, isEqual, cloneDeep } from 'lodash';
import {
  strategyGameFactory, type BoardClientProps, type Ctx, type MoveOutcome, GameBoard
} from '../../strategy-game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { getAllowedMoves, generateStartBoard, isTarget, boardSize, type Board, type Field } from './helpers';
import { RookSvg } from '../shared/rook-svg';

const BoardClient = ({ board, moves }: BoardClientProps<Board>) => {
  const isMoveAllowed = (targetField: Field) => moves.moveRook.isAllowed!(board, targetField);

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

export const moves = {
  moveRook: {
    validate: (board: Board, _, target: Field) =>
      some(getAllowedMoves(board), field => isEqual(field, target)),
    apply: (board: Board, { ctx }: { ctx: Ctx }, { row, col }: Field): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard.rookPosition = { row, col };

      if (isTarget({ row, col })) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

const rule = {
  hu: <>
    Egy 8 × 8-as tábla egyik mezőjére elhelyezünk egy bástyát. A két játékos felváltva léphet a
    bástyával. Egy lépésben vagy jobbra lehet akármennyit lépni, vagy lefelé lehet akármennyit lépni.
    Az a játékos nyer, aki a jobb alsó mezőre lép a bástyával.
  </>,
  en: <>
    A rook is placed on one of the squares of an 8 × 8 board. The two players move the rook
    alternately. In a move you may go any number of squares to the right, or any number of squares
    downward. The player who moves the rook onto the bottom-right square wins.
  </>
};

export const RookToCorner = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription: () => ({
      hu: 'Kattints egy mezőre a bástyától jobbra vagy lefelé.',
      en: 'Click a square to the right of or below the rook.'
    })
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt', en: 'Test' } },
    // smart bot: verified as optimal (2-heap Nim, P-positions are the main diagonal)
    { botStrategy: smartBotStrategy, generateStartBoard, label: { hu: 'Teljes', en: 'Full' }, isDefault: true }
  ]
});
