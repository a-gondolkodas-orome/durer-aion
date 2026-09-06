// The two most recent competition games, each a self-contained folder under
// src/ — gameplay, bot, curated start boards, board client and specs together.
// A game exports a config object (`StrategyGameConfig`); the host decides what
// to do with it — apps/strategy-practice turns each into a page with
// `strategyGameFactory` at its one export site.
export { removeDivisorMultipleConfig } from './src/remove-divisor-multiple/remove-divisor-multiple';
export {
  stonesRemoveOneNotTwiceFromLeftConfig
} from './src/stones-remove-one-not-twice-from-left/stones-remove-one-not-twice-from-left';
