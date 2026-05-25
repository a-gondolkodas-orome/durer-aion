import { useState } from 'react';
import { range, cloneDeep, isEqual, flatMap, sample, last, shuffle } from 'lodash';
import {
  strategyGameFactory, dummyEvents, type Events, type StrategyArgs, type BoardClientProps
} from '../../game-factory';

type Board = [number, number][]
type Field = { row: number, col: number }

const BOARDSIZE = 6;
const getId = ({ row, col }: Field) => row * BOARDSIZE + col;
const isCovered = (field: Field, board: Board) => flatMap(board).includes(getId(field));

const getDominoDirection = (field: Field, board: Board) => {
  const domino = board.find(d => d.includes(getId(field)))!;
  const neighbor = domino[0] === getId(field) ? domino[1] : domino[0];
  const nCol = neighbor % BOARDSIZE;
  const nRow = (neighbor - nCol) / BOARDSIZE;
  if (field.row === nRow) return field.col < nCol ? 'left' : 'right';
  return field.row < nRow ? 'top' : 'bottom';
};

// Each direction: all 4 borders except the opposite side, rounded on its own side.
const DOMINO_BORDER_CLASSES = {
  left:   'rounded-l-md border-t-4 border-b-4 border-l-4',
  right:  'rounded-r-md border-t-4 border-b-4 border-r-4',
  top:    'rounded-t-md border-t-4 border-l-4 border-r-4',
  bottom: 'rounded-b-md border-b-4 border-l-4 border-r-4'
};

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [hoveredField, setHoveredField] = useState<Field | null>(null);

  const hasEmptyNeighbor = ({ row, col }) => {
    if (col < (BOARDSIZE - 1) && !isCovered({ row, col: col + 1 }, board)) return true;
    if (col >= 1 && !isCovered({ row, col: col - 1 }, board)) return true;
    if (row < (BOARDSIZE - 1) && !isCovered({ row: row + 1, col }, board)) return true;
    if (row >= 1 && !isCovered({ row: row - 1, col }, board)) return true;
    return false;
  }

  const clickField = (field: Field) => {
    if (selectedField === null) { setSelectedField(field); return; }
    if (isEqual(field, selectedField)) { setSelectedField(null); return; }
    moves.placeDomino(board, [getId(selectedField), getId(field)]);
    setSelectedField(null);
  };

  const isNeighborOfSelected = ({ row, col }) => {
    if (selectedField === null) return false;
    if (row === selectedField.row && Math.abs(col - selectedField.col) === 1) return true;
    if (col === selectedField.col && Math.abs(row - selectedField.row) === 1) return true;
    return false;
  }

  const isPartOfPreview = (field: Field) => {
    if (selectedField === null || hoveredField === null) return false;
    if (!isNeighborOfSelected(hoveredField) || isCovered(hoveredField, board)) return false;
    return isEqual(field, selectedField) || isEqual(field, hoveredField);
  };

  const getCellBgClass = (field: Field) => {
    if (isCovered(field, board)) return 'bg-slate-600 border-black';
    if (!ctx.isClientMoveAllowed) return '';
    if (isPartOfPreview(field)) return 'bg-blue-500';
    if (isEqual(selectedField, field)) return 'bg-blue-600';
    if (isNeighborOfSelected(field)) return 'bg-blue-100';
    return '';
  };

  const isClickAllowed = (field: Field) => {
    if (!ctx.isClientMoveAllowed) return false;
    if (isCovered(field, board)) return false;
    if (!hasEmptyNeighbor(field)) return false;
    if (selectedField !== null && isEqual(field, selectedField)) return true;
    if (selectedField !== null && !isNeighborOfSelected(field)) return false;
    return true;
  }

  const getDominoBorders = (field: Field) => {
    if (!isCovered(field, board)) return '';
    return DOMINO_BORDER_CLASSES[getDominoDirection(field, board)];
  }

  return (
  <section className="p-2 shrink-0 grow basis-2/3">
    <table className="w-full border-collapse table-fixed">
      <tbody>
        {range(BOARDSIZE).map(row => (
          <tr key={row}>
            {range(BOARDSIZE).map(col => (
              <td
                key={col}
                className="border-4"
              >
                <button
                  className={`
                    aspect-square w-full p-[5%] relative
                    ${!isClickAllowed({ row, col }) ? 'cursor-not-allowed' : ''}
                    ${getCellBgClass({ row, col })}
                    ${getDominoBorders({ row, col })}
                  `}
                  disabled={!isClickAllowed({ row, col })}
                  onClick={() => clickField({ row, col })}
                  onMouseOver={() => setHoveredField({ row, col })}
                  onMouseOut={() => setHoveredField(null)}
                  onFocus={() => setHoveredField({ row, col })}
                  onBlur={() => setHoveredField(null)}
                >
                  {isCovered({ row, col }, board) && <>
                    <span className={`
                      aspect-square rounded-full bg-yellow-400 inline-block
                      absolute z-20 left-[40%] right-[40%] bottom-[40%]
                    `} />
                    {getDominoDirection({ row, col }, board) === 'left' && (
                      <span className={
                        'absolute right-0 top-0 bottom-0 w-1.5 bg-yellow-400 z-10 translate-x-full'
                      } />
                    )}
                    {getDominoDirection({ row, col }, board) === 'top' && (
                      <span className={
                        'absolute bottom-0 left-0 right-0 h-1.5 bg-yellow-400 z-10 translate-y-full'
                      } />
                    )}
                  </>}
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

const getPossibleMoves = (board: Board) => {
  const possibleMoves: [number, number][] = [];
  const boardIndices = flatMap(
    range(0, BOARDSIZE), row => range(0, BOARDSIZE).map(col => ({ row, col }))
  );
  boardIndices.forEach(({ row, col }) => {
    if (isCovered({ row, col }, board)) return;
    if (col < (BOARDSIZE - 1) && !isCovered({ row, col: col + 1 }, board)) {
      possibleMoves.push([getId({row, col }), getId({ row, col: col + 1 })])
    };
    if (row < (BOARDSIZE - 1) && !isCovered({ row: row + 1, col }, board)) {
      possibleMoves.push([getId({row, col }), getId({ row: row + 1, col })])
    };
  });

  return possibleMoves;
}

const moves = {
  placeDomino: (board: Board, { events }: { events: Events }, domino) => {
    const nextBoard = cloneDeep(board);
    nextBoard.push(domino);
    events.endTurn();
    if (getPossibleMoves(nextBoard).length === 0) {
      events.endGame();
    }
    return { nextBoard };
  }
}

const randomBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  moves.placeDomino(board, sample(getPossibleMoves(board)));
};

// Note: Currently the AI may not win even from a winning position if the player
// selected winning role but then did not follow winning strategy due to intractability.
// We may improve AI with some heuristic and leveraging equivalent positions.
const smartBotStrategy = ({ board, moves, ctx }: StrategyArgs<Board>) => {
  const possibleMoves = getPossibleMoves(board);
  if (possibleMoves.length >= 20) {
    if (ctx.chosenRoleIndex === 1) {
      const randomDomino = sample(getPossibleMoves(board));
      moves.placeDomino(board, randomDomino);
    } else {
      const lastDomino = last(board)!;
      const N = BOARDSIZE * BOARDSIZE - 1;
      const mirrorImage = [N - lastDomino[0], N - lastDomino[1]];
      moves.placeDomino(board, mirrorImage);
    }
  } else {
    const optimalMove = getOptimalSmartBotMove(board);
    moves.placeDomino(board, optimalMove);
  }
}

const getOptimalSmartBotMove = (board: Board) => {
  const allowedMoves = getPossibleMoves(board);
  const optimalPlace = shuffle(allowedMoves).find(i => {
    const { nextBoard } = moves.placeDomino(board, { events: dummyEvents }, i);
    return isWinningState(nextBoard, false);
  });

  if (optimalPlace !== undefined) {
    return optimalPlace;
  }
  return sample(allowedMoves);
};

// given board *after* your step, are you set up to win the game for sure?
const isWinningState = (board: Board, amIPlayer) => {
  const allowedPlacesForOther = getPossibleMoves(board);
  if (allowedPlacesForOther.length === 0) {
    return true;
  }

  const optimalPlaceForOther = allowedPlacesForOther.find(i => {
    const { nextBoard } = moves.placeDomino(board, { events: dummyEvents }, i);
    return isWinningState(nextBoard, !amIPlayer);
  });
  return optimalPlaceForOther === undefined;
};

const toldalek = {
  '4': 'e',
  '6': 'o',
  '8': 'a'
}

const rule = {
  hu: <>
    Két játékos felváltva tesz egy-egy dominót egy {BOARDSIZE} × {BOARDSIZE}-{toldalek[BOARDSIZE]}s
    sakktáblára úgy, hogy két élszomszédos üres mezőt fedjen le. Az veszít aki nem tud tenni.
  </>,
  en: <>
    Two players take turns placing a domino on a {BOARDSIZE} × {BOARDSIZE} chessboard so that it
    covers two adjacent empty squares. The player who cannot place a domino loses.
  </>
};

export const DominoesOnChessboard = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription: () => ({
      hu: 'Kattints egy üres mezőre, majd egy szomszédjára, hogy lehelyezz egy dominót.',
      en: 'Click an empty square, then a neighbour of it, to place a domino.'
    })
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt 🤖', en: 'Test 🤖' } },
    {
      botStrategy: smartBotStrategy,
      generateStartBoard: () => [],
      label: { hu: 'Okos 🤖', en: 'Smart 🤖' },
      isDefault: true
    }
  ]
});
