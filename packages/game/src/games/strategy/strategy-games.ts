// The strategy games' registries, one per package entry. This one is the shared
// half: the game definitions and their names, which the server and every client
// need alike. The bots live in strategy-bots.ts (the `game/bot` entry) and the
// boards and descriptions in strategy-client.ts (`game/client`), and each
// registry imports a game folder's *files*, never a folder barrel — a barrel
// re-exporting `strategy` next to `board` is what would hand the bot to the
// live client again. entries.test.ts walks the three graphs to pin this.
import type { CompetitionCategory } from "schemas";
import { MyGameWrapper as GameWrapper20ocde } from "./20ocde/game";
import type { MyGameState as GameState20ocde } from "./20ocde/game";

// One state type per competition category, on the `game` entry so a year's game can
// type its board against the category it is played in. This year's one game is
// shared by all three categories, so nothing in this repo reads these — the
// consumer is the year's private repo, which a sweep of this one cannot see.
export type MyGameStateC = GameState20ocde;
export type MyGameStateD = GameState20ocde;
export type MyGameStateE = GameState20ocde;

export const MyGameWrappers = {
  C: () => GameWrapper20ocde("C"),
  D: () => GameWrapper20ocde("D"),
  E: () => GameWrapper20ocde("E"),
}

export const strategyNames = {
  // need to be unique even if the game is the same
  // should also match up with the name defined in game.ts
  C: "20oc",
  D: "20od",
  E: "20oe",
} satisfies Record<CompetitionCategory, string>;
