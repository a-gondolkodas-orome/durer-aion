// The `game/bot` entry: the strategy games' bots and their lookup tables. The
// server and the offline dry run import it; the live client must not — see
// CLAUDE.md § Creating a New Game.
export { StrategyWrappers } from './src/games/strategy/strategy-bots';
