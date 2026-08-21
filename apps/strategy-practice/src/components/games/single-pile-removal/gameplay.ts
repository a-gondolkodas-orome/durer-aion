// Shared board shape for the pebble take-away games (three-more, waning-stones,
// doubling-reduction). `stones` is the number of pebbles left in the pile.
// `maxTake` is the most a player may take this turn: each game bakes its opening
// cap into the start board, and its `take` move derives the next cap from its
// own rule.
export type Board = { stones: number; maxTake: number }

// The most a player may legally take this turn.
export const cap = (board: Board): number => Math.min(board.maxTake, board.stones);

// A take is legal when it removes a whole number of pebbles, at least one and at
// most this turn's cap. The three games differ only in how the *next* cap is
// derived, so they share this one validator.
export const validateTake = (board: Board, _, count: number): boolean =>
  Number.isInteger(count) && count >= 1 && count <= cap(board);
