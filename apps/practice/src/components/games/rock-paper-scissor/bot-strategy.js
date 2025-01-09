'use strict';

import { random } from 'lodash';

export const aiBotStrategy = ({ board, ctx, moves }) => {
  const idx = getOptimalAiMove(board, ctx.chosenRoleIndex);
  moves.removeSymbol(board, idx);
};

export const getOptimalAiMove = (board, chosenRoleIndex) => {
  // start with a random place as a first step
  if (chosenRoleIndex === 1) {
    const allowedPlaces = [0, 1, 2].filter(i => board[1][i] !== null);
    if (allowedPlaces.length === 3) {
      return random(0, 2);
    }
  }

  // as a first player still try to win if second player may not play optimally
  if (chosenRoleIndex === 1) {
    // pairs to still have chance
    // we have two cards left to choose from so at least one option is available
    const pairs = [[0, 2], [1, 0], [2, 1], [0, 0], [1, 1], [2, 2]];
    for (const p of pairs) {

      // first is occupied, second is not from given pair
      if (board[0][p[0]] === null && board[1][p[1]] !== null) {
        return p[1];
      }
    }
  }

  // as a second player proceed with chosing useless player's piece

  if (chosenRoleIndex === 0) {
    // pairs beating each other
    const pairs = [[0, 1], [1, 2], [2, 0]];
    for (const p of pairs) {
      // first is not occupied, second is occupied from given pair
      if (board[0][p[0]] !== null && board[1][p[1]] === null) {
        return p[0];
      }
    }
  }
};
