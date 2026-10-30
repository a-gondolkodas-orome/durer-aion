// The bot half of the registries — see strategy-games.ts. Only the server and
// the offline dry run import this, through the `game/bot` entry.
import { strategyWrapper as Strategy20ocde } from "./20ocde/strategy";

export const StrategyWrappers = {
  C: () => Strategy20ocde("C"),
  D: () => Strategy20ocde("D"),
  E: () => Strategy20ocde("E"),
}
