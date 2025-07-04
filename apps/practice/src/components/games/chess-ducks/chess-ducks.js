import React from 'react';
import { strategyGameFactory } from '../strategy-game';
import { cloneDeep, some, flatMap, range, isEqual, sample, shuffle } from 'lodash';
import { DuckSvg } from './rubber-duck-svg';

const chessDucksGameFactory = ({ ROWS, COLS }) => {
  const [DUCK, FORBIDDEN] = [1, 2]

  const generateStartBoard = () => {
    return range(0, ROWS).map(() => range(0, COLS).map(() => null));
  };

  const boardIndices = flatMap(range(0, ROWS), row => range(0, COLS).map(col => ({ row, col })));

  const getAllowedMoves = (board) => {
    return boardIndices.filter(({ row, col }) => board[row][col] === null);
  };

  const markForbiddenFields = (board, { row, col }) => {
    if (row - 1 >= 0) {
      board[(row - 1)][col] = FORBIDDEN;
    }
    if (row + 1 <= (ROWS - 1)) {
      board[(row + 1)][col] = FORBIDDEN;
    }
    if (col - 1 >= 0) {
      board[(row)][col - 1] = FORBIDDEN;
    }
    if (col + 1 <= (COLS - 1)) {
      board[(row)][col + 1] = FORBIDDEN;
    }
  };


  const BoardClient = ({ board, ctx, moves }) => {
    const clickField = (field) => {
      if (!isMoveAllowed(field)) return;

      moves.placeDuck(board, field);
    };

    const isMoveAllowed = (targetField) => {
      if (!ctx.shouldRoleSelectorMoveNext) return false;
      return some(getAllowedMoves(board), field => isEqual(field, targetField));
    };

    const isForbidden = ({ row, col }) => {
      return board[row][col] === FORBIDDEN;
    };
    const isDuck = ({ row, col }) => {
      return board[row][col] === DUCK;
    };

    return(
      <section className="p-2 shrink-0 grow basis-2/3">
        <DuckSvg />
        <table className="m-2 w-full border-collapse table-fixed">
        <tbody>
          {range(ROWS).map(row => (
            <tr key={row}>
              {range(COLS).map(col => (
                <td
                  key={col}
                  onClick={() => clickField({ row, col })}
                  className={`
                    border-4
                    ${isForbidden({ row, col }) ? 'bg-slate-400 cursor-not-allowed' : ''}
                  `}
                >
                  <button
                    className="aspect-square w-full h-full p-[5%]"
                    disabled={!isMoveAllowed({ row, col })}
                  >
                    {isDuck({ row, col }) && (
                      <span>
                        <svg className="inline-block aspect-square">
                          <use xlinkHref="#game-duck" />
                        </svg>
                      </span>
                    )}
                  </button>
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
    placeDuck: (board, { events }, { row, col }) => {
      const nextBoard = cloneDeep(board);
      nextBoard[row][col] = DUCK;
      markForbiddenFields(nextBoard, { row, col });
      events.endTurn();
      if (getAllowedMoves(nextBoard).length === 0) {
        events.endGame();
      }
      return { nextBoard }
    }
  };

  const aiBotStrategy = ({ board, moves }) => {
    const aiMove = getOptimalAiMove(board);
    moves.placeDuck(board, aiMove);
  };

  const getOptimalAiMove = (board) => {
    const allowedMoves = getAllowedMoves(board);

    const duckCount = boardIndices.filter(({ row, col }) => board[row][col] === DUCK).length;

    // live search is too slow and there is no optimal first step anyways
    if (duckCount === 0) {
      return sample(allowedMoves);
    }

    // sample + find has the same effect as filter + sample: find a random
    // from the optimal moves
    const optimalPlace = shuffle(allowedMoves).find(({ row, col }) => {
      const boardCopy = cloneDeep(board);
      markForbiddenFields(boardCopy, { row, col });
      boardCopy[row][col] = DUCK;
      return isWinningState(boardCopy, false);
    });


    if (optimalPlace !== undefined) {
      return optimalPlace;
    }
    return sample(allowedMoves);
  };

  // given board *after* your step, are you set up to win the game for sure?
  const isWinningState = (board, amIPlayer) => {
    if (getAllowedMoves(board).length === 0) {
      return true;
    }

    const allowedPlacesForOther = getAllowedMoves(board);

    const optimalPlaceForOther = allowedPlacesForOther.find(({ row, col }) => {
      const boardCopy = cloneDeep(board);
      markForbiddenFields(boardCopy, { row, col });
      boardCopy[row][col] = DUCK;
      return isWinningState(boardCopy, !amIPlayer);
    });
    return optimalPlaceForOther === undefined;
  };

  const rule = <>
    Azt sokan tudják, hogy egy ló hogy lép a sakktáblán, de azt már nagyon kevesen, hogy
  egy kacsa hogyan: a négy oldalszomszédos mezőre tud lépni. A két játékos felváltva rak le a {ROWS} × {COLS}-os
  táblára kacsákat úgy, hogy a lerakott bábu ne üsse a táblán levő kacsák egyikét sem. Az veszít, aki
  nem tud lépni.
  </>;

  return strategyGameFactory({
    rule,
    title: `Békés kacsák a ${ROWS} × ${COLS}-${COLS === 6 ? 'o' : 'e'}s sakktáblán`,
    BoardClient,
    getPlayerStepDescription: () => 'Kattints egy mezőre, amit nem üt egyik kacsa sem.',
    generateStartBoard,
    aiBotStrategy,
    moves
  });
}

export const ChessDucksC = chessDucksGameFactory({ ROWS: 4, COLS: 6 });
export const ChessDucksE = chessDucksGameFactory({ ROWS: 4, COLS: 7 });
