// Exact solver for a normal-play combinatorial game: the player with no legal
// move loses. `legalMoves` returning [] is therefore the terminal test — there
// is no separate terminal predicate to keep in sync with it.
//
// Precondition: the game is a finite DAG — every move strictly decreases some
// measure of the position, so the recursion terminates. There is no cycle
// detection; a game where a position can repeat needs a different search.
//
// The solver answers only *which moves win*. What to play when none of them do
// is a per-game judgement (drag the game out, avoid handing over an obvious
// win, concede) and deliberately has no home here.

type Solver<Position, Move> = {
  isWinningForMover: (position: Position) => boolean;
  winningMoves: (position: Position) => Move[];
};

export const createWinLossSolver = <Position, Move>({ key, legalMoves, apply }: {
  // The position's identity for memoisation. This is where a game folds in its
  // symmetries — sorting a multiset of piles, canonicalising a graph labelling —
  // so that equivalent positions are searched once.
  key: (position: Position) => string;
  legalMoves: (position: Position) => Move[];
  apply: (position: Position, move: Move) => Position;
}): Solver<Position, Move> => {
  // The value of a position depends on nothing but the position, so the memo
  // stays valid for the lifetime of the module — across matches and across the
  // specs of a single run.
  const memo = new Map<string, boolean>();

  const isWinningForMover = (position: Position): boolean => {
    const k = key(position);
    const cached = memo.get(k);
    if (cached !== undefined) return cached;

    // Written as `some` rather than via winningMoves so the search stops at the
    // first winning move instead of evaluating every one of them.
    const result = legalMoves(position).some(
      (move) => !isWinningForMover(apply(position, move))
    );
    memo.set(k, result);
    return result;
  };

  const winningMoves = (position: Position): Move[] =>
    legalMoves(position).filter((move) => !isWinningForMover(apply(position, move)));

  return { isWinningForMover, winningMoves };
};
