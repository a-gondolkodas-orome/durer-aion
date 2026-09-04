// The strategy games' registries, one per package entry. This one is the shared
// half: the game definitions and their names, which the server and every client
// need alike. The bots live in strategy-bots.ts (the `game/bot` entry) and the
// boards and descriptions in strategy-client.ts (`game/client`), and each
// registry imports a game folder's *files*, never a folder barrel — a barrel
// re-exporting `strategy` next to `board` is what would hand the bot to the
// live client again. entries.test.ts walks the three graphs to pin this.
import {
  MyGameWrapper as StonesGameWrapper,
  MyGameState as StonesGameState
} from "./stones/game";
import {
  MyGameWrapper as GameWrapper19ocd,
  MyGameState as GameState19ocd
} from "./19ocd/game";

export type MyGameStateC = GameState19ocd;
export type MyGameStateD = GameState19ocd;
export type MyGameStateE = StonesGameState;

export const MyGameWrappers = {
  C: () => GameWrapper19ocd("C"),
  D: () => GameWrapper19ocd("D"),
  E: () => StonesGameWrapper("E"),
}

export const strategyNames = {
  // need to be unique even if the game is the same
  // should also match up with the name defined in game.ts
  C: "19oc",
  D: "19od",
  E: "stones_e",
}
