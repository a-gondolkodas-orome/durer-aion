import { sample } from 'lodash';
import type { StrategyArgs } from '../../../game-factory';
import { type Board } from './shark-chase';
import sharkExceptionMoves from './shark-exception-moves.json';

const getAdjacentCells = (pos: number): number[] => {
  const cells: number[] = [];
  if (pos + 5 < 25) cells.push(pos + 5);
  if (pos - 5 >= 0) cells.push(pos - 5);
  if (pos + 1 < 25 && pos % 5 !== 4) cells.push(pos + 1);
  if (pos - 1 >= 0 && pos % 5 !== 0) cells.push(pos - 1);
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
      return { from: 8, to: 7 };
    case 2:
      return { from: 9, to: 14 };
    case 3:
      return { from: 14, to: 13 };
    case 4:
      return { from: 7, to: 6 };
    case 5:
      return { from: 6, to: 11 };
    case 6:
      return { from: 11, to: 16 };
    case 7:
      return { from: 13, to: 12 };
    case 8:
      return { from: 16, to: 21 };
		case 9:
			return { from: 4, to: 9 };
    default:
      if ( [0,1,5,6,10,15].includes(board.shark) ) {
        switch(board.turn) {
          case 10:
            return { from: 9, to: 8 };
          case 11:
            return { from: 8, to: 7 };
          case 12:
            return { from: 7, to: 6 };
          case 13:
            return { from: 6, to: 5 };
					case 14:
						if ( board.shark == 15 ) {
							return { from: 5, to: 10 };
						}
						else {
							return { from: 3, to: 2 };
						}
        }
      } else {
        switch(board.turn){
          case 10:
            return { from: 9, to: 14 };
          case 11:
            return { from: 14, to: 19 };
          case 12:
            return { from: 0, to: 4 };
          case 13:
            return { from: 4, to: 8 };
					case 14:
						return { from: 21, to: 22 };
      }
      break;
    }
  }
  return undefined;
};

const findSubmarineNextToShark = (board: Board): number | undefined => {
  if (board.shark+5 < 25 && board.submarines[board.shark+5] >= 1) return board.shark+5;
  if (board.shark-5 >= 0 && board.submarines[board.shark-5] >= 1) return board.shark-5;
  if (board.shark+1 < 25 && board.shark%5 !== 4 && board.submarines[board.shark+1] >= 1) return board.shark+1;
  if (board.shark-1 >= 0 && board.shark%5 !== 0 && board.submarines[board.shark-1] >= 1) return board.shark-1;
  return undefined;
};

const distanceFromShark = (shark: number, id: number): number => {
  return (
    Math.abs((shark % 5) - (id % 5)) +
    Math.abs(Math.floor(shark / 5) - Math.floor(id / 5))
  );
}

// Greedy fallback used only when no move guarantees survival (game is already lost):
// picks the reachable cell with the largest "safe" connected component (cells not
// adjacent to any submarine), preferring central cells, then progressively further out.
const selectByLocationPreference = (submarines: number[], pool: number[]): number => {
  const componentSizes = getComponentSizes(submarines);

  let maxi = 1;
  for (const i of pool) {
    if (maxi < componentSizes[i]) maxi = componentSizes[i];
  }

  const matching = (group: number[]) => pool.filter(i => group.includes(i) && componentSizes[i] === maxi);

  const groups = [[12], [7, 11, 13, 17], [6, 8, 16, 18], [2, 10, 14, 22], [1, 3, 5, 9, 15, 19, 21, 23], [0, 4, 20, 24]];
  let possibleMoves: number[] = [];
  for (const group of groups) {
    possibleMoves = matching(group);
    if (possibleMoves.length > 0) break;
  }

  return sample(possibleMoves.length > 0 ? possibleMoves : pool)!;
}

// Is the shark guaranteed to survive to day 15 if it moves to `to` on its current
// turn, assuming the researchers then play optimally against it from here on?
const isMoveWinning = (submarines: number[], to: number, turn: number, memo: Map<string, boolean>): boolean => {
  const nextTurn = turn + 1;
  if (nextTurn > 15) return true;
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
  outer: for (let from = 0; from < 25; from++) {
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
  for (let to = 0; to < 25; to++) {
    if (isReachableWithoutDeath(submarines, shark, to) && isMoveWinning(submarines, to, turn, memo)) {
      sharkSurvives = true;
      break;
    }
  }
  memo.set(key, sharkSurvives);
  return sharkSurvives;
}

// The exact search below is fast once few turns remain, but can take a few seconds
// on the first several turns since the reachable state space is still large. In the
// huge majority of early-game states the cheap heuristic already picks a winning move
// on its own, so up to PRECOMPUTE_MAX_TURN we only consult a small precomputed table of
// the rare exceptions (states where the heuristic would pick a losing move), stored in
// shark-exception-moves.json, and use the heuristic directly everywhere else - skipping
// the expensive search entirely for early turns. Regenerate via
// scripts/pre-generate-ai-moves/shark-chase-5/shark-chase-5-exceptions.cjs if the game
// rules or heuristic ever change.
const PRECOMPUTE_MAX_TURN = 8;

const exceptionKey = (submarines: number[], shark: number, turn: number): string =>
  `${submarines.join(',')}|${shark}|${turn}`;


export const getNextSharkPositionByAI = (board: Board): number | undefined => {
  const { submarines, shark, turn } = board;
  const reachable: number[] = [];
  for (let i = 0; i < 25; i++) {
    if (isReachableWithoutDeath(submarines, shark, i)) {
      reachable.push(i);
    }
  }

  if (turn <= PRECOMPUTE_MAX_TURN) {
    const exception = sharkExceptionMoves[exceptionKey(submarines, shark, turn)];
    return exception !== undefined ? exception : selectByLocationPreference(submarines, reachable);
  }

  const memo = new Map<string, boolean>();
  const winningMoves = reachable.filter(to => isMoveWinning(submarines, to, turn, memo));

  return selectByLocationPreference(submarines, winningMoves.length > 0 ? winningMoves : reachable);
}

const isReachableWithoutDeath = (submarines: number[], shark: number, id: number): boolean => {
  if (distanceFromShark(shark, id) > 2) return false;
  if (submarines[id] >= 1) return false;
  if (distanceFromShark(shark, id) === 2) {
    if (id === shark - 2 && submarines[shark - 1] >= 1) return false;	// bal
    if (id === shark + 2 && submarines[shark + 1] >= 1) return false;	// jobb
    if (id === shark + 10 && submarines[shark + 5] >= 1) return false;// lent
    if (id === shark - 10 && submarines[shark - 5] >= 1) return false;// fent
    if (id === shark - 6 && (submarines[shark - 5] >= 1 && submarines[shark - 1] >= 1)) return false; // bal fent
    if (id === shark + 4 && (submarines[shark + 5] >= 1 && submarines[shark - 1] >= 1)) return false; // bal lent
    if (id === shark + 6 && (submarines[shark + 5] >= 1 && submarines[shark + 1] >= 1)) return false; // jobb lent
    if (id === shark - 4 && (submarines[shark - 5] >= 1 && submarines[shark + 1] >= 1)) return false; // jobb fent
  }
  return true;
}

const getIntermediateSharkPosition = (submarines: number[], shark: number, id: number): number => {
  if (id === shark - 2) return shark - 1;
  if (id === shark + 2) return shark + 1;
  if (id === shark + 10) return shark + 5;
  if (id === shark - 10) return shark - 5;
  if (id === shark - 6 && submarines[shark - 5] >= 1) return shark - 1;
  if (id === shark + 4 && submarines[shark + 5] >= 1) return shark - 1;
  if (id === shark + 6 && submarines[shark + 5] >= 1) return shark + 1;
  if (id === shark - 4 && submarines[shark - 5] >= 1) return shark + 1;
  if (id === shark - 6 && submarines[shark - 1] >= 1) return shark - 5;
  if (id === shark + 4 && submarines[shark - 1] >= 1) return shark + 5;
  if (id === shark + 6 && submarines[shark + 1] >= 1) return shark + 5;
  if (id === shark - 4 && submarines[shark + 1] >= 1) return shark - 5;
  if (id === shark - 6) return shark - 5;
  if (id === shark + 4) return shark + 5;
  if (id === shark + 6) return shark + 5;
  if (id === shark - 4) return shark - 5;
  return id;
}

// osszefuggosegi komponensek a tengeralattjarokkal nem kozvetlen szomszedos mezokbol
const getComponentSizes = (submarines: number[]): number[] => {
  const isNextToSubmarine = (id: number): boolean => {
    if (id+5 < 25 && submarines[id+5] >= 1) return true;
    if (id-5 >= 0 && submarines[id-5] >= 1) return true;
    if (id+1 < 25 && id%5 !== 4 && submarines[id+1] >= 1) return true;
    if (id-1 >= 0 && id%5 !== 0 && submarines[id-1] >= 1) return true;
    if (submarines[id] >= 1) return true;
    return false;
  }

  const visited = Array(25).fill(false);
  const visited2 = Array(25).fill(false);
  const componentSizes = Array(25).fill(0);
  const queue: number[] = [];
  let first: number;

  for (let i = 0; i<25; i++)
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
        if (first+5 < 25 && !isNextToSubmarine(first+5) && visited[first+5] == false) {
          queue.push(first+5); visited[first+5]=true
        }
        if (first-5 >= 0 && !isNextToSubmarine(first-5) && visited[first-5] == false) {
          queue.push(first-5); visited[first-5]=true
        }
        if (first+1 < 25 && first%5 !== 4 && !isNextToSubmarine(first+1) && visited[first+1] == false) {
          queue.push(first+1); visited[first+1]=true
        }
        if (first-1 >= 0 && first%5 !== 0 && !isNextToSubmarine(first-1) && visited[first-1] == false) {
          queue.push(first-1); visited[first-1]=true
        }
      }
      queue.push(i);
      visited2[i] = true;
      while(queue.length > 0)
      {
        first = queue.shift()!;
        componentSizes[first] = counter;
        if (first+5 < 25 && !isNextToSubmarine(first+5) && visited2[first+5] == false) {
          queue.push(first+5); visited2[first+5] = true;
        }
        if (first-5 >= 0 && !isNextToSubmarine(first-5) && visited2[first-5] == false) {
          queue.push(first-5); visited2[first-5] = true;
        }
        if (first+1 < 25 && first%5 !== 4 && !isNextToSubmarine(first+1) && visited2[first+1] == false) {
          queue.push(first+1); visited2[first+1] = true;
        }
        if (first-1 >= 0 && first%5 !== 0 && !isNextToSubmarine(first-1) && visited2[first-1] == false) {
          queue.push(first-1); visited2[first-1] = true;
        }
      }
    }
  }
  return componentSizes;
}
