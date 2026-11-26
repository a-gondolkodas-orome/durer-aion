// The bot half of the registries — see strategy-games.ts. Only the server and
// the offline dry run import this, through the `game/bot` entry.
import { strategyWrapper as Strategy20ocde } from "./20ocde/strategy";
import { strategyWrapper as StrategyKetkupac } from "./ketkupac/strategy";
import { strategyWrapper as StrategySablon } from "./sablon/strategy";

import type { State } from "boardgame.io";
import type { GameStateMixin } from "../../common/types";
import type { StrategyGameKey, StrategyGameStates } from "./strategy-games";

/// A game's bot: its next move, or its opening position, as a move's arguments
/// and name.
export type StrategyBot<G> = (state: State<G & GameStateMixin>, botID: string) => [unknown, string];

export const StrategyWrappers: { [K in StrategyGameKey]: () => StrategyBot<StrategyGameStates[K]> } = {
  "20o-c": () => Strategy20ocde("C"),
  "20o-d": () => Strategy20ocde("D"),
  "20o-e": () => Strategy20ocde("E"),
  "minta-ketkupac": () => StrategyKetkupac(),
  "minta-sablon": () => StrategySablon(),
};
