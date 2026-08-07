import { sample } from 'lodash';
import type { BotMove, BotStrategy } from '../../../strategy-game-factory';
import type { Board } from '../gameplay';
import { makeGeometry } from '../bot-geometry';
import type { Moves } from './gameplay';

type Bot = BotStrategy<Board, Moves>

const {
  getAdjacentCells, findSubmarineNextToShark, distanceFromShark,
  isReachableWithoutDeath, getIntermediateSharkPosition, getComponentSizes
} = makeGeometry(4);


// The shark's turn is a route of up to two steps, named as a whole: the halfway
// cell is only chosen to reach the target safely, so the two are one decision.
// Standing still is the one single-step turn — any real first step leaves the
// turn open for a second, so a route that stops after `via` would strand the
// bot mid-turn. Returning to `from` is a two-step route like any other.
const asSharkRoute = (from: number, via: number, to: number): BotMove<Moves>[] =>
  via === from
    ? [{ move: 'moveShark', args: [from] }]
    : [{ move: 'moveShark', args: [via] }, { move: 'moveShark', args: [to] }];

export const randomBotStrategy: Bot = ({ board, ctx }) => {
  if (ctx.chosenRoleIndex === 0) {
    const safeMoves = [...getAdjacentCells(board.shark).filter(c => board.submarines[c] === 0), board.shark];
    const firstPos = sample(safeMoves)!;
    // Staying put is the whole turn; a real first step earns a second one.
    if (firstPos === board.shark) return { move: 'moveShark', args: [firstPos] };
    const safeCells = getAdjacentCells(firstPos).filter(c => board.submarines[c] === 0);
    return asSharkRoute(board.shark, firstPos, sample([...safeCells, firstPos])!);
  } else {
    const winningFrom = findSubmarineNextToShark(board);
    if (winningFrom !== undefined) {
      return { move: 'moveSubmarine', args: [{ from: winningFrom, to: board.shark }] };
    }
    const validMoves: { from: number; to: number }[] = [];
    board.submarines.forEach((count, from) => {
      if (count >= 1) getAdjacentCells(from).forEach(to => validMoves.push({ from, to }));
    });
    const approachingMoves = validMoves.filter(
      ({ from, to }) => distanceFromShark(board.shark, to) < distanceFromShark(board.shark, from)
    );
    return {
      move: 'moveSubmarine',
      args: [sample(approachingMoves.length > 0 ? approachingMoves : validMoves)!]
    };
  }
};

export const smartBotStrategy: Bot = ({ board, ctx }) => {
  if (ctx.chosenRoleIndex === 0) {
    const finalPos = getNextSharkPositionByAI(board)!;
    const firstPos = getIntermediateSharkPosition(board.submarines, board.shark, finalPos);
    return asSharkRoute(board.shark, firstPos, finalPos);
  } else {
    const { from, to } = getOptimalSubmarineMoveByBot(board)!;
    return { move: 'moveSubmarine', args: [{ from, to }] };
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


