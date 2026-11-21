// The `game/client` entry: the strategy games as the browser plays them, each
// game's rules, board and description together. The frontends import it; the
// server, which never renders a board, does not.
export { strategyClientFor } from './src/games/strategy/strategy-client';
export type { StrategyClientParts } from './src/games/strategy/strategy-client';
