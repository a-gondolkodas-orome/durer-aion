// The bot half of the registries — see strategy-games.ts. Only the server and
// the offline dry run import this, through the `game/bot` entry.
import { strategyWrapper as Strategy20ocde } from "./20ocde/strategy";

import type { StrategyGameKey } from "./strategy-games";

export const StrategyWrappers = {
  "20o-c": () => Strategy20ocde("C"),
  "20o-d": () => Strategy20ocde("D"),
  "20o-e": () => Strategy20ocde("E"),
} satisfies Record<StrategyGameKey, unknown>;
