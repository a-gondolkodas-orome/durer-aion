import { random } from 'lodash';
import type { Board } from '../gameplay';

// Played on three piles; the rules are the shared pile-splitting ones unchanged.
export { moves, type Board, type Piece, type Moves } from '../gameplay';

export const generateStartBoard = (): Board => {
  const x = random(2, 8) * 2 + 1;
  const y = random(3, Math.min(20, 33 - x));
  return [x, y, 37 - x - y];
};
