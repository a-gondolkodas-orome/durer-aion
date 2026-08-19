import type { CompetitionGame } from 'games/server';
import {
  removeDivisorMultipleCompetition,
  stonesRemoveOneNotTwiceFromLeftCompetition,
} from 'games/server';

// Which game each category plays on the v2 stack — the counterpart of
// strategyNames for boardgame.io. A category must appear in its game's
// liveStartBoardsByCategory; strategy-v2-games.test.ts pins that.
export const strategyV2Games: Record<string, CompetitionGame<any>> = {
  C: removeDivisorMultipleCompetition,
  D: removeDivisorMultipleCompetition,
  E: stonesRemoveOneNotTwiceFromLeftCompetition,
};
