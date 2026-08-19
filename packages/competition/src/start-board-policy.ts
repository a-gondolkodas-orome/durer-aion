import type { CompetitionMatchState } from './types';

// Which curated board a live attempt starts from, given where the team
// stands. The lists are laid out as loss-indexed pairs whose two members are
// a streak's two boards — the shape the old per-game startingPosition
// functions shared — so: pair = prior losses (clamped to the last pair, as
// the old stones table clamped), member = current streak. The streak in an
// open match is only ever 0 or 1; a second win ends it.
//
// Pure over the tally so a replayed START_ATTEMPT needs no policy at all —
// the chosen board rides in the event; this only serves the route choosing it.
export const startBoardIndexForTally = (
  tally: CompetitionMatchState<unknown>['tally'],
  listLength: number
): number => {
  if (listLength < 2 || listLength % 2 !== 0) {
    throw new Error(`startBoardIndexForTally: the list must be loss-indexed pairs, got length ${listLength}`);
  }
  const pair = Math.min(tally.losses, listLength / 2 - 1);
  return 2 * pair + tally.streak;
};
