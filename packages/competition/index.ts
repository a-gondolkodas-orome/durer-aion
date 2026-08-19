// The competition rules with no transport or storage attached (Phase 2 of
// docs/boardgame-io-replacement-plan.md): what one team's match at one game
// is as data, and how one event moves it. The server routes Phase 3 adds own
// persistence, auth and the bot loop; everything they must agree on — the
// scoring ladder, the clock and its grace, attempt flow — lives once, here.
export type {
  CompetitionMatchState, CompetitionEvent, CompetitionRejection,
  ApplyEventResult, Difficulty
} from './src/types';
export {
  applyEvent, createCompetitionMatchState, pointsForSecondWin, LENGTH_OF_COMPETITION_MINUTES
} from './src/apply-event';
export { toClientView } from './src/client-view';
export type { StrategyMatchClientView } from './src/client-view';
export { startBoardIndexForTally } from './src/start-board-policy';
