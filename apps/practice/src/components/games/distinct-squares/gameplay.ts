// Both distinct-squares games place a piece on any square, at any time — there
// is no notion of a square being full or blocked. So the only thing legality
// has to say is that the square exists.
//
// That is worth saying: `apply` does `nextBoard[squareId] += 1`, and on an
// out-of-range index that writes NaN and grows the array rather than doing
// nothing. The two games differ only in how many squares they have, which the
// predicate reads off the board.
export const isPlacementAllowed = (board: number[], squareId: number): boolean =>
  Number.isInteger(squareId) && squareId >= 0 && squareId < board.length;
