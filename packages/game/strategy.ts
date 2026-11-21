// The `game/strategy` entry: the strategy games' definitions, keyed by the
// game id a competition names. The server and the offline dry run import it;
// the live client must not, since a game's code is to reach a team's browser
// only once the team has started that game (#643).
export { MyGameWrappers, strategyGameClients, strategyGames } from './src/games/strategy/strategy-games';
export type { StrategyGameKey, StrategyGameStates } from './src/games/strategy/strategy-games';
