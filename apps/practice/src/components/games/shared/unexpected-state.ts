// A branch a game's strategy holds to be unreachable — every vertex banned
// while the game has not ended, a mirror move the symmetry argument says must
// be free. Reaching one is a bug in the strategy, not a position to handle, so
// this makes the same trade the engine makes for an illegal move: throw in dev
// so the bug is loud and located, warn in prod and let the caller take its
// fallback, since a suboptimal or stalled bot beats a white-screened game.
export const reportUnexpectedState = (message: string): void => {
  if (import.meta.env.DEV) throw new Error(message);
  console.warn(message);
};
