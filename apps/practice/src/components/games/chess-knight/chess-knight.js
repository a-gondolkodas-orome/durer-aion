import React from 'react';
import { range, some, isEqual, cloneDeep } from 'lodash';
import { strategyGameFactory } from '../strategy-game';
import { aiBotStrategy } from './bot-strategy';
import { getAllowedMoves, generateStartBoard, markVisitedFields } from './helpers';
import { ChessKnightSvg } from './chess-knight-svg';

const BoardClient = ({ board, ctx, moves }) => {
  const clickField = (field) => {
    if (!isMoveAllowed(field)) return;

    moves.moveKnight(board, field);
  };
  const isMoveAllowed = (targetField) => {
    if (!ctx.shouldRoleSelectorMoveNext) return false;
    return some(getAllowedMoves(board), field => isEqual(field, targetField));
  };

  return (
  <section className="p-2 shrink-0 grow basis-2/3">
    <ChessKnightSvg />
    <table className="border-collapse w-full table-fixed">
      <tbody>
        {range(4).map(row => (
          <tr key={row}>
            {range(4).map(col => (
              <td
                key={col}
                onClick={() => clickField({ row, col })}
                className={`border-4 ${board.chessBoard[row][col] === 'visited' ? 'bg-slate-300' : ''}`}
              >
                <div className="aspect-square p-[5%] w-full">
                  <button className="w-full aspect-square" disabled={!isMoveAllowed({ row, col })}>
                    {isMoveAllowed({ row, col }) && (
                      <span>
                        <svg className="w-full aspect-square opacity-25 inline-block">
                          <use xlinkHref="#game-chess-knight" />
                        </svg>
                      </span>
                    )}
                    {board.chessBoard[row][col] === 'knight' && (
                      <span>
                        <svg className="w-full aspect-square inline-block">
                          <use xlinkHref="#game-chess-knight" />
                        </svg>
                      </span>
                    )}
                  </button>
                </div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </section>
  );
};

const moves = {
  moveKnight: (board, { events }, { row, col }) => {
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
}

const rule = <>
  Egy 4 × 4-es tábla egyik mezőjén kezdetben egy huszár áll. Két játékos felváltva
lép a huszárral. Nem szabad olyan mezőre lépni, amelyen korábban már járt a huszár,
így a kezdőmezőre sem. Az veszít, aki nem tud lépni.
</>;

export const ChessKnight = strategyGameFactory({
  rule,
  title: 'Barangolás huszárral',
  BoardClient,
  getPlayerStepDescription: () => 'Lépj egy szabad mezőre a huszárral.',
  generateStartBoard,
  moves,
  aiBotStrategy
});
