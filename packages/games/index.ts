// The live competition games, each a self-contained folder under src/ —
// gameplay, bot, curated start boards, board client and specs together
// (Phase 1 of docs/boardgame-io-replacement-plan.md). A game exports a
// config object (`StrategyGameConfig`); the host decides what to do with it —
// apps/practice turns each into a page with `strategyGameFactory` at its one
// export site, and the competition server and shell consume the same object
// from Phase 3 on.
export { removeDivisorMultipleConfig } from './src/remove-divisor-multiple/remove-divisor-multiple';
export {
  competitionStartBoardsC, competitionStartBoardsD
} from './src/remove-divisor-multiple/start-boards';
export {
  stonesRemoveOneNotTwiceFromLeftConfig
} from './src/stones-remove-one-not-twice-from-left/stones-remove-one-not-twice-from-left';
