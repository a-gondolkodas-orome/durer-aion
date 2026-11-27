// The `game/client` entry: each strategy game's rules, board and description.
// The server, which never renders a board, does not import it.
export { strategyClientFor } from './src/games/strategy/strategy-client';
export type { StrategyClientParts } from './src/games/strategy/strategy-client';
