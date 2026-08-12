import { random, times } from 'lodash';
import { isLosingForMover, type Board } from '../gameplay';

// Played on four piles; the rules are the shared pile-splitting ones unchanged.
export { moves, type Board, type Piece, type Moves } from '../gameplay';

// Both roles get a start board they can win from about half the time.
export const generateStartBoard = (): Board => generateStartBoardWonBy(random(0, 1) === 1);

// The test variant plays out faster: smaller piles, and fewer trials spent
// hunting for a board of the wanted kind.
export const generateTestStartBoard = (): Board =>
  generateStartBoardWonBy(random(0, 1) === 1, { pileMin: 3, pileMax: 6, remainingTrials: 5 });

type BoardOptions = { pileMin?: number; pileMax?: number; remainingTrials?: number };

// Draw boards until one falls on the wanted side of `isLosingForMover`, then
// vary its shape: doubling, and doubling with one piece taken off, both leave
// the win/loss class untouched (see `isLosingForMover`), so they widen the pool
// for free. Every option has to be threaded through the retry — a retry that
// fell back to the defaults is how the test variant used to end up with
// full-size boards.
const generateStartBoardWonBy = (
  moverWins: boolean,
  { pileMin = 5, pileMax = 12, remainingTrials = 50 }: BoardOptions = {}
): Board => {
  const board = times(4, () => random(pileMin, pileMax));

  if (!isLosingForMover(board) !== moverWins) {
    if (remainingTrials === 0) return board;
    return generateStartBoardWonBy(
      moverWins, { pileMin, pileMax, remainingTrials: remainingTrials - 1 }
    );
  }

  const variation = random(0, 2);
  if (variation === 0) return board;
  const doubled = board.map(x => x * 2);
  if (variation === 1) return doubled;
  doubled[random(0, 3)] -= 1;
  return doubled;
};
