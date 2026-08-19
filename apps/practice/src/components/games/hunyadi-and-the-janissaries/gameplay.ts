import { random, flatten, cloneDeep, sum, tail } from 'lodash';

export type SoldierColor = 'blue' | 'red';
export type Board = SoldierColor[][];
export type Soldier = { rowIndex: number; pieceIndex: number; group: SoldierColor };

export const generateStartBoard = (): Board => {
  // Not an exact 50/50 generator between the two roles, only a roughly balanced
  // one, biased towards boards with more soldiers so the game lasts more than a
  // single step.
  const rowCount = 5;
  let board: SoldierColor[][] = [];
  // Complexity score: a soldier counts for more the closer to the castle it
  // starts. The threshold below rejects boards that would be over too quickly.
  let totalScore = 0;
  for (let i = 0; i < (rowCount - 1); i++) {
    const row: SoldierColor[] = [];
    if (i === 0) {
      row.push('blue');
      totalScore += 1;
    }
    if (random(0, 6) >= 3) {
      row.push('blue');
      totalScore += (1/2)**i;
    }
    board.push(row);
  }
  board.push([]);

  for (let i = 0; i < (rowCount - 1); i++) {
    for (let j = 0; j < board[i].length; j++) {
      if (random(0, 4) >= 2) {
        board[i].splice(j, 1);
        board[i + 1].push('blue', 'blue');
      }
    }
  }

  const soldierCount = sum(board.map(row => row.length));
  if (totalScore <= 1.25 || soldierCount <= 2) {
    // generate a more complex situation
    return generateStartBoard();
  }

  // first pile: for soldiers who reached the castle
  return [[], ...board];
};

export const [SULTAN, HUNYADI] = [0, 1];

// Hunyadi destroys one of the two colours. Wiping out a colour nobody was
// assigned to is allowed by the rules (it simply achieves nothing), so the
// colour being present on the staircase is not part of legality.
const isColor = (group: string): group is SoldierColor => group === 'blue' || group === 'red';

// A soldier reference points at an actual soldier on the staircase, and the
// group it is assigned to is one of the two colours the sultan splits into.
const isSoldierAssignmentAllowed = (board: Board, soldiers: Soldier[]): boolean =>
  Array.isArray(soldiers) && soldiers.every(
    ({ rowIndex, pieceIndex, group }) =>
      isColor(group) && board[rowIndex]?.[pieceIndex] !== undefined
  );

export const moves = {
  killGroup: {
    validate: (_board: Board, { ctx }, group: SoldierColor) =>
      ctx.currentPlayer === HUNYADI && isColor(group),
    apply: (board: Board, _, group: SoldierColor) => {
      const nextBoard = board.map(row => row.filter(soldier => soldier !== group));

      if (flatten(nextBoard).length === 0) {
        return { nextBoard, gameEnd: { winnerIndex: HUNYADI } };
      }
      return { nextBoard, autoEndOfTurn: true };
    }
  },
  finalizeSeparation: {
    validate: (_board: Board, { ctx }) => ctx.currentPlayer === SULTAN,
    apply: (board: Board) => ({ nextBoard: board, isTurnEnd: true })
  },
  setGroupOfSoldiers: {
    validate: (board: Board, { ctx }, soldiers: Soldier[]) =>
      ctx.currentPlayer === SULTAN && isSoldierAssignmentAllowed(board, soldiers),
    apply: (board: Board, _, soldiers: Soldier[]) => {
      const nextBoard = cloneDeep(board);
      for (const soldier of soldiers) {
        nextBoard[soldier.rowIndex][soldier.pieceIndex] = soldier.group;
      }
      return { nextBoard };
    }
  },
  // endOfTurn move automatically initiated by game engine
  stepUp: {
    apply: (board: Board) => {
      const nextBoard = [...tail(board), []];
      if (nextBoard[0].length > 0) {
        return { nextBoard, gameEnd: { winnerIndex: SULTAN } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;

