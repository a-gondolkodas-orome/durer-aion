import { sample } from 'lodash';
import type { StrategyArgs } from '../../../game-factory';
import { type Board } from './shark-chase';

const getAdjacentCells = (pos: number): number[] => {
  const cells: number[] = [];
  if (pos + 4 < 16) cells.push(pos + 4);
  if (pos - 4 >= 0) cells.push(pos - 4);
  if (pos + 1 < 16 && pos % 4 !== 3) cells.push(pos + 1);
  if (pos - 1 >= 0 && pos % 4 !== 0) cells.push(pos - 1);
  return cells;
};

export const randomBotStrategy = ({ board, ctx, moves }: StrategyArgs<Board>) => {
  if (ctx.chosenRoleIndex === 0) {
    const safeMoves = [...getAdjacentCells(board.shark).filter(c => board.submarines[c] === 0), board.shark];
    const firstPos = sample(safeMoves)!;
    const { nextBoard } = moves.moveShark(board, firstPos);
    if (nextBoard.sharkMovesInTurn === 1) {
      setTimeout(() => {
        const safeCells = getAdjacentCells(nextBoard.shark).filter(c => nextBoard.submarines[c] === 0);
        const secondMoves = [...safeCells, nextBoard.shark];
        moves.moveShark(nextBoard, sample(secondMoves)!);
      }, firstPos === board.shark ? 0 : 750);
    }
  } else {
    const winningFrom = findSubmarineNextToShark(board);
    if (winningFrom !== undefined) {
      moves.moveSubmarine(board, { from: winningFrom, to: board.shark });
      return;
    }
    const validMoves: { from: number; to: number }[] = [];
    board.submarines.forEach((count, from) => {
      if (count >= 1) getAdjacentCells(from).forEach(to => validMoves.push({ from, to }));
    });
    const approachingMoves = validMoves.filter(
      ({ from, to }) => distanceFromShark(board.shark, to) < distanceFromShark(board.shark, from)
    );
    moves.moveSubmarine(board, sample(approachingMoves.length > 0 ? approachingMoves : validMoves)!);
  }
};

export const smartBotStrategy = ({ board, ctx, moves }: StrategyArgs<Board>) => {
  if (ctx.chosenRoleIndex === 0) {
    const finalPos = getNextSharkPositionByAI(board)!;
    const firstPos = getIntermediateSharkPosition(board.submarines, board.shark, finalPos);
    const { nextBoard } = moves.moveShark(board, firstPos);
    if (finalPos !== board.shark) {
      setTimeout(() => {
        moves.moveShark(nextBoard, finalPos);
      }, firstPos === finalPos ? 0 : 750);
    }
  } else {
    const { from, to } = getOptimalSubmarineMoveByBot(board)!;
    moves.moveSubmarine(board, { from, to });
  }
};

const getOptimalSubmarineMoveByBot = (board: Board): { from: number; to: number } | undefined => {
  const submarineNextToShark = findSubmarineNextToShark(board);
  if (submarineNextToShark !== undefined) {
    return { from: submarineNextToShark, to: board.shark }
  }

  switch(board.turn){
    case 1:
      return { from: 2, to: 1 };
    case 2:
      return { from: 1, to: 5 };
    case 3:
      return { from: 7, to: 6 };
    case 4:
      return { from: 6, to: 10 };
    case 5:
      return { from: 10, to: 14 };
    case 6:
      return { from: 3, to: 2 };
    default:
      if (board.shark === 7 || board.shark === 11) {
        switch(board.turn) {
          case 7:
            return { from: 2, to: 3 };
          case 8:
            return { from: 3, to: 7 };
          case 9:
            return { from: 7, to: 11 };
        }
      } else {
        switch(board.turn){
          case 7:
            return { from: 2, to: 1 };
          case 8:
            return { from: 1, to: 0 };
          case 9:
            return { from: 0, to: 4 };
          case 10:
            return { from: 4, to: 8 };
      }
      break;
    }
  }
  return undefined;
};

const findSubmarineNextToShark = (board: Board): number | undefined => {
  if (board.shark+4 < 16 && board.submarines[board.shark+4] >= 1) return board.shark+4;
  if (board.shark-4 >= 0 && board.submarines[board.shark-4] >= 1) return board.shark-4;
  if (board.shark+1 < 16 && board.shark%4 !== 3 && board.submarines[board.shark+1] >= 1) return board.shark+1;
  if (board.shark-1 >= 0 && board.shark%4 !== 0 && board.submarines[board.shark-1] >= 1) return board.shark-1;
  return undefined;
};

const distanceFromShark = (shark: number, id: number): number => {
  return (
    Math.abs((shark % 4) - (id % 4)) +
    Math.abs(Math.floor(shark / 4) - Math.floor(id / 4))
  );
}

// Greedy fallback used only when no move guarantees survival (game is already lost):
// picks the reachable cell with the largest "safe" connected component (cells not
// adjacent to any submarine), preferring central cells, then edges, then corners.
const selectByLocationPreference = (submarines: number[], pool: number[]): number => {
  const componentSizes = getComponentSizes(submarines);

  let maxi = 1;
  for (const i of pool) {
    if (maxi < componentSizes[i]) maxi = componentSizes[i];
  }

  const matching = (group: number[]) => pool.filter(i => group.includes(i) && componentSizes[i] === maxi);

  const possibleMoves =
    matching([5, 6, 9, 10]).length > 0 ? matching([5, 6, 9, 10]) :
    matching([1, 2, 4, 7, 8, 11, 13, 14]).length > 0 ? matching([1, 2, 4, 7, 8, 11, 13, 14]) :
    matching([0, 3, 12, 15]).length > 0 ? matching([0, 3, 12, 15]) :
    pool;

  return sample(possibleMoves)!;
}

// Is the shark guaranteed to survive to day 11 if it moves to `to` on its current
// turn, assuming the researchers then play optimally against it from here on?
const isMoveWinning = (submarines: number[], to: number, turn: number, memo: Map<string, boolean>): boolean => {
  const nextTurn = turn + 1;
  if (nextTurn > 11) return true;
  return canSharkSurviveSubmarineTurn(submarines, to, nextTurn, memo);
}

const stateKey = (submarines: number[], shark: number, turn: number, phase: 'sub' | 'shark'): string =>
  `${submarines.join(',')}|${shark}|${turn}|${phase}`;

// Researchers move next (one submarine, one adjacent step); can they force a capture
// from here, however the shark plays afterwards?
const canSharkSurviveSubmarineTurn = (
  submarines: number[], shark: number, turn: number, memo: Map<string, boolean>
): boolean => {
  const key = stateKey(submarines, shark, turn, 'sub');
  const cached = memo.get(key);
  if (cached !== undefined) return cached;

  let sharkSurvives = true;
  outer: for (let from = 0; from < 16; from++) {
    if (submarines[from] === 0) continue;
    for (const to of getAdjacentCells(from)) {
      const nextSubmarines = submarines.slice();
      nextSubmarines[from] -= 1;
      nextSubmarines[to] += 1;
      const sharkSurvivesHere =
        nextSubmarines[shark] < 1 && canSharkSurviveSharkTurn(nextSubmarines, shark, turn, memo);
      if (!sharkSurvivesHere) {
        sharkSurvives = false;
        break outer;
      }
    }
  }
  memo.set(key, sharkSurvives);
  return sharkSurvives;
}

// Shark moves next; does it have at least one move (of up to 2 steps) keeping it safe?
const canSharkSurviveSharkTurn = (
  submarines: number[], shark: number, turn: number, memo: Map<string, boolean>
): boolean => {
  const key = stateKey(submarines, shark, turn, 'shark');
  const cached = memo.get(key);
  if (cached !== undefined) return cached;

  let sharkSurvives = false;
  for (let to = 0; to < 16; to++) {
    if (isReachableWithoutDeath(submarines, shark, to) && isMoveWinning(submarines, to, turn, memo)) {
      sharkSurvives = true;
      break;
    }
  }
  memo.set(key, sharkSurvives);
  return sharkSurvives;
}

// Shared across calls: isMoveWinning/canSharkSurviveSubmarineTurn/canSharkSurviveSharkTurn
// are pure functions of (submarines, shark, turn), so results from earlier moves/tests
// remain valid and are worth keeping.
const sharkSurvivalMemo = new Map<string, boolean>();

export const getNextSharkPositionByAI = (board: Board): number | undefined => {
  const { submarines, shark, turn } = board;
  const reachable: number[] = [];
  for (let i = 0; i < 16; i++) {
    if (isReachableWithoutDeath(submarines, shark, i)) {
      reachable.push(i);
    }
  }

  const winningMoves = reachable.filter(to => isMoveWinning(submarines, to, turn, sharkSurvivalMemo));

  return selectByLocationPreference(submarines, winningMoves.length > 0 ? winningMoves : reachable);
}

const isReachableWithoutDeath = (submarines: number[], shark: number, id: number): boolean => {
  if (distanceFromShark(shark, id) > 2) return false;
  if (submarines[id] >= 1) return false;
  if (distanceFromShark(shark, id) === 2) {
    if (id === shark - 2 && submarines[shark - 1] >= 1) return false;
    if (id === shark + 2 && submarines[shark + 1] >= 1) return false;
    if (id === shark + 8 && submarines[shark + 4] >= 1) return false;
    if (id === shark - 8 && submarines[shark - 4] >= 1) return false;
    if (id === shark - 5 && (submarines[shark - 4] >= 1 && submarines[shark - 1] >= 1)) return false;
    if (id === shark + 3 && (submarines[shark + 4] >= 1 && submarines[shark - 1] >= 1)) return false;
    if (id === shark + 5 && (submarines[shark + 4] >= 1 && submarines[shark + 1] >= 1)) return false;
    if (id === shark - 3 && (submarines[shark - 4] >= 1 && submarines[shark + 1] >= 1)) return false;
  }
  return true;
}

const getIntermediateSharkPosition = (submarines: number[], shark: number, id: number): number => {
  if (id === shark - 2) return shark - 1;
  if (id === shark + 2) return shark + 1;
  if (id === shark + 8) return shark + 4;
  if (id === shark - 8) return shark - 4;
  if (id === shark - 5 && submarines[shark - 4] >= 1) return shark - 1;
  if (id === shark + 3 && submarines[shark + 4] >= 1) return shark - 1;
  if (id === shark + 5 && submarines[shark + 4] >= 1) return shark + 1;
  if (id === shark - 3 && submarines[shark - 4] >= 1) return shark + 1;
  if (id === shark - 5 && submarines[shark - 1] >= 1) return shark - 4;
  if (id === shark + 3 && submarines[shark - 1] >= 1) return shark + 4;
  if (id === shark + 5 && submarines[shark + 1] >= 1) return shark + 4;
  if (id === shark - 3 && submarines[shark + 1] >= 1) return shark - 4;
  if (id === shark - 5) return shark - 4;
  if (id === shark + 3) return shark + 4;
  if (id === shark + 5) return shark + 4;
  if (id === shark - 3) return shark - 4;
  return id;
}

// osszefuggosegi komponensek a tengeralattjarokkal nem kozvetlen szomszedos mezokbol
const getComponentSizes = (submarines: number[]): number[] => {
  const isNextToSubmarine = (id: number): boolean => {
    if (id+4 < 16 && submarines[id+4] >= 1) return true;
    if (id-4 >= 0 && submarines[id-4] >= 1) return true;
    if (id+1 < 16 && id%4 !== 3 && submarines[id+1] >= 1) return true;
    if (id-1 >= 0 && id%4 !== 0 && submarines[id-1] >= 1) return true;
    if (submarines[id] >= 1) return true;
    return false;
  }

  const visited = Array(16).fill(false);
  const visited2 = Array(16).fill(false);
  const componentSizes = Array(16).fill(0);
  const queue: number[] = [];
  let first: number;

  for (let i = 0; i<16; i++)
  {
    if (!visited[i] && !isNextToSubmarine(i))
    {
      queue.push(i);
      visited[i] = true;
      let counter = 0;
      while(queue.length > 0)
      {
        counter++;
        first = queue.shift()!;
        if (first+4 < 16 && !isNextToSubmarine(first+4) && visited[first+4] == false) {
          queue.push(first+4); visited[first+4]=true
        }
        if (first-4 >= 0 && !isNextToSubmarine(first-4) && visited[first-4] == false) {
          queue.push(first-4); visited[first-4]=true
        }
        if (first+1 < 16 && first%4 !== 3 && !isNextToSubmarine(first+1) && visited[first+1] == false) {
          queue.push(first+1); visited[first+1]=true
        }
        if (first-1 >= 0 && first%4 !== 0 && !isNextToSubmarine(first-1) && visited[first-1] == false) {
          queue.push(first-1); visited[first-1]=true
        }
      }
      queue.push(i);
      visited2[i] = true;
      while(queue.length > 0)
      {
        first = queue.shift()!;
        componentSizes[first] = counter;
        if (first+4 < 16 && !isNextToSubmarine(first+4) && visited2[first+4] == false) {
          queue.push(first+4); visited2[first+4] = true;
        }
        if (first-4 >= 0 && !isNextToSubmarine(first-4) && visited2[first-4] == false) {
          queue.push(first-4); visited2[first-4] = true;
        }
        if (first+1 < 16 && first%4 !== 3 && !isNextToSubmarine(first+1) && visited2[first+1] == false) {
          queue.push(first+1); visited2[first+1] = true;
        }
        if (first-1 >= 0 && first%4 !== 0 && !isNextToSubmarine(first-1) && visited2[first-1] == false) {
          queue.push(first-1); visited2[first-1] = true;
        }
      }
    }
  }
  return componentSizes;
}
