import type { Ctx, MoveOutcome } from 'strategy-game-factory';
import { range, random, sample, difference, cloneDeep } from 'lodash';
export const neighbours = {
  0: [1, 2, 4],
  1: [0, 3, 5],
  2: [0, 3, 6],
  3: [1, 2, 7],
  4: [0, 5, 6],
  5: [1, 4, 7],
  6: [2, 4, 7],
  7: [3, 5, 6]
};

export const VERTEX_COUNT = 8;

export const isVertex = (vertex: number): boolean =>
  Number.isInteger(vertex) && vertex >= 0 && vertex < VERTEX_COUNT;

// Everyone moves along a single road, and everyone must move every round, so
// every move in this game boils down to "is the target an intersection
// adjacent to the one the piece stands on".
export const isNeighbour = (from: number, to: number): boolean =>
  isVertex(from) && isVertex(to) && neighbours[from].includes(to);

// Player 0 chases, player 1 runs. Both indices appear in move legality, in the
// `gameEnd` winner a move returns and in the board client, so they get names.
export const [POLICE, THIEF] = [0, 1];

export type Board = {
  turnCount: number
  policemen: number[]
  thief: number
  firstPolicemanMoved: boolean
}

export const generateStartBoardA = (): Board => {
  const policeStartPosition = random(0, 7);
  const immediatePoliceWinPositions = [policeStartPosition, ...neighbours[policeStartPosition]];
  const thiefStartPosition = sample(difference(range(0, 8), immediatePoliceWinPositions));
  return {
    turnCount: 0,
    policemen: [policeStartPosition, policeStartPosition],
    thief: thiefStartPosition,
    firstPolicemanMoved: false
  };
};

export const generateStartBoardB = (): Board => {
  const policeStartPosition = [random(0, 7), random(0, 7)];
  const immediatePoliceWinPositions = [
    ...policeStartPosition,
    ...neighbours[policeStartPosition[0]],
    ...neighbours[policeStartPosition[1]]
  ];
  const thiefStartPositionOptions = difference(range(0, 8), immediatePoliceWinPositions);
  if (thiefStartPositionOptions.length === 0) {
    return generateStartBoardB();
  }
  const thiefStartPosition = sample(thiefStartPositionOptions);
  return {
    turnCount: 0,
    policemen: policeStartPosition,
    thief: thiefStartPosition,
    firstPolicemanMoved: false
  };
};

// A police round is two half-moves — blue then green — and `firstPolicemanMoved`
// records which half is due, so no turn state is needed. The thief's move
// belongs to the other player entirely, hence the currentPlayer checks: they
// say *which* piece may move, not merely whose turn it is.
export const moves = {
  moveThief: {
    validate: (board: Board, { ctx }: { ctx: Ctx }, vertex: number) =>
      ctx.currentPlayer === THIEF && isNeighbour(board.thief, vertex),
    apply: (board: Board, _, vertex: number): MoveOutcome<Board> => {
      const overrides: Partial<Board> = { thief: vertex, turnCount: board.turnCount + 1 };
      const nextBoard = { ...cloneDeep(board), ...overrides };
      if (isGameEnd(nextBoard)) {
        return {
          nextBoard,
          gameEnd: { winnerIndex: hasFirstPlayerWon(nextBoard) ? POLICE : THIEF }
        };
      }
      return { nextBoard, isTurnEnd: true };
    }
  },
  moveFirstPoliceman: {
    validate: (board: Board, { ctx }: { ctx: Ctx }, vertex: number) =>
      ctx.currentPlayer === POLICE && !board.firstPolicemanMoved
        && isNeighbour(board.policemen[0], vertex),
    // First half of the police turn: both policemen move, one after the other.
    apply: (board: Board, _, vertex: number): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard.policemen[0] = vertex;
      nextBoard.firstPolicemanMoved = true;
      return { nextBoard };
    }
  },
  moveSecondPoliceman: {
    validate: (board: Board, { ctx }: { ctx: Ctx }, vertex: number) =>
      ctx.currentPlayer === POLICE && board.firstPolicemanMoved
        && isNeighbour(board.policemen[1], vertex),
    apply: (board: Board, _, vertex: number): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard.policemen[1] = vertex;
      nextBoard.firstPolicemanMoved = false;
      if (isGameEnd(nextBoard)) {
        return {
          nextBoard,
          gameEnd: { winnerIndex: hasFirstPlayerWon(nextBoard) ? POLICE : THIEF }
        };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;

const isGameEnd = (board: Board) => {
  if (board.turnCount === 3) {
    return true;
  } else if (board.thief === board.policemen[0] || board.thief === board.policemen[1]) {
    return true;
  }
  return false;
};

const hasFirstPlayerWon = (board: Board) => {
  return board.turnCount < 4 && board.policemen.includes(board.thief);
};
