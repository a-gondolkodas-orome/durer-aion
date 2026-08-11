import { random } from 'lodash';
import { asTurn, getOptimalDivision, type Bot, type BotStep } from '../bot-strategy';
import type { Board } from './gameplay';

export { randomBotStrategy } from '../bot-strategy';

export const smartBotStrategy: Bot = ({ board }) => asTurn(getSmartBotStep(board));

export const getSmartBotStep = (board: Board): BotStep => {
  const start = random(0, 2);
  let removedPileId: number, splitPileId: number;

  if (board.some(size => size % 2 === 1)) {
    if (board[start] % 2 === 0) {
      if (board[(start + 1) % 3] % 2 === 0) {
        removedPileId = (start + 1) % 3;
        splitPileId = start;
      } else {
        removedPileId = (start + 2) % 3;
        splitPileId = start;
      }
    } else if (board[(start + 1) % 3] % 2 === 0) {
      removedPileId = (start + 2) % 3;
      splitPileId = (start + 1) % 3;
    } else if (board[(start + 2) % 3] % 2 === 0) {
      removedPileId = (start + 1) % 3;
      splitPileId = (start + 2) % 3;
    } else {
      if (board[start] !== 1) {
        removedPileId = (start + 1) % 3;
        splitPileId = start;
      } else if (board[(start + 1) % 3] !== 1) {
        removedPileId = (start + 2) % 3;
        splitPileId = (start + 1) % 3;
      } else {
        removedPileId = start;
        splitPileId = (start + 2) % 3;
      }
    }
    return {
      removedPileId,
      pileId: splitPileId,
      pieceCount: getOptimalDivision(board[splitPileId])
    };
  } else if (board.every(size => size === 2)) {
    return {
      removedPileId: (start + 1) % 3,
      pileId: start,
      pieceCount: getOptimalDivision(board[start])
    };
  } else {
    // Every pile even and not all 2: halving is the same position one scale
    // down, so the odd-pile strategy above applies to it. The 37-piece start is
    // odd, so an optimal line never reaches here — it is the branch that keeps
    // the bot playing well after the opponent has left one.
    const botStep = getSmartBotStep(board.map((x) => x / 2));
    return { ...botStep, pieceCount: botStep.pieceCount * 2 };
  }
};
