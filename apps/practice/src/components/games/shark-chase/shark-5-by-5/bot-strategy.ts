import type { Board } from '../gameplay';
import { makeSharkBots } from '../bot-search';
import { MAX_TURN } from './gameplay';
import sharkExceptionMoves from './shark-exception-moves.json';

// The researchers' winning line on the 5 × 5 lake: a move per day, branching on
// where the shark is once the two halves of the lake need different answers. It
// stops where the shark can no longer be alive — and its second branch is wrong
// from day 12 on, naming a submarine on sector 0, which never holds one.
// `makeSharkBots` searches for a move wherever this names none or names one the
// position does not allow, which is what covers both.
const getOptimalSubmarineMoveByBot = (board: Board): { from: number; to: number } | undefined => {
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
      if ([0, 1, 5, 6, 10, 15].includes(board.shark)) {
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
            return board.shark === 15 ? { from: 5, to: 10 } : { from: 3, to: 2 };
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
      }
  }
  return undefined;
};

// The exact search is fast once few days remain, but can take seconds on the
// first several, where the reachable state space is still large. In the huge
// majority of early-game positions the location preference already picks a
// winning sector on its own, so up to PRECOMPUTE_MAX_TURN a small precomputed
// table names the rare exceptions — the positions where the preference would
// pick a losing sector — and everywhere else the preference is used as it
// stands, skipping the search entirely. Regenerate the table via
// scripts/pre-generate-ai-moves/shark-chase-5/shark-chase-5-exceptions.cjs if
// the game rules or the preference ever change.
const PRECOMPUTE_MAX_TURN = 8;

const exceptionKey = (submarines: number[], shark: number, turn: number): string =>
  `${submarines.join(',')}|${shark}|${turn}`;

const precomputedSurvivingSectors = (board: Board, reachable: number[]): number[] | undefined => {
  if (board.turn > PRECOMPUTE_MAX_TURN) return undefined;
  const exception = sharkExceptionMoves[exceptionKey(board.submarines, board.shark, board.turn)];
  // Naming every reachable sector is what leaves the preference to choose freely
  // among them, which is the whole of the heuristic these days are played by.
  return exception === undefined ? reachable : [exception];
};

export const {
  randomBotStrategy, smartBotStrategy, getNextSharkPositionByAI
} = makeSharkBots({
  size: 5,
  maxTurn: MAX_TURN,
  scriptedSubmarineMove: getOptimalSubmarineMoveByBot,
  survivingSectors: precomputedSurvivingSectors
});
