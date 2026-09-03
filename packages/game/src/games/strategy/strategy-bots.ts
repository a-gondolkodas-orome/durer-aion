// The bot half of the registries — see strategy-games.ts. Only the server and
// the offline dry run import this, through the `game/bot` entry.
import { strategyWrapper as stonesStrategy } from "./stones/strategy";
import { strategyWrapper as Strategy19ocd } from "./19ocd/strategy";

export const StrategyWrappers = {
  C: () => Strategy19ocd("C"),
  D: () => Strategy19ocd("D"),
  E: () => stonesStrategy("E"),
}
