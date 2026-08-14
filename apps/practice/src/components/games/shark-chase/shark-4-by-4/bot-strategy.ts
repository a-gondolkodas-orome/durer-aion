import type { Board } from '../gameplay';
import { makeSharkBots } from '../bot-search';
import { MAX_TURN } from './gameplay';

// The researchers' winning line on the 4 × 4 lake: a move per day, branching on
// where the shark is once the two halves of the lake need different answers. It
// stops where the shark can no longer be alive; `makeSharkBots` searches for a
// move wherever this names none or names one the position does not allow.
const getOptimalSubmarineMoveByBot = (board: Board): { from: number; to: number } | undefined => {
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

export const {
  randomBotStrategy, smartBotStrategy, getNextSharkPositionByAI
} = makeSharkBots({
  size: 4,
  maxTurn: MAX_TURN,
  scriptedSubmarineMove: getOptimalSubmarineMoveByBot
});
