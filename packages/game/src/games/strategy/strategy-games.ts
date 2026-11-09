// The strategy games' registries, one per package entry. This one is the shared
// half: the game definitions and their names, which the server and every client
// need alike. The bots live in strategy-bots.ts (the `game/bot` entry) and the
// boards and descriptions in strategy-client.ts (`game/client`), and each
// registry imports a game folder's *files*, never a folder barrel — a barrel
// re-exporting `strategy` next to `board` is what would hand the bot to the
// live client again. ESLint holds each registry to the files it may import
// (eslint.config.mjs).
import type { CompetitionCategory, StrategyGameId, StrategyGameInfo } from "schemas";
import { MyGameWrapper as GameWrapper20ocde } from "./20ocde/game";
import type { MyGameState as GameState20ocde } from "./20ocde/game";

// The strategy games a competition can name (`StrategyConfig.gameId`), each a
// game in one variant, and the languages its board and description exist in.
// Every other registry, here and in the other two entries, is keyed the same.
export const strategyGames = {
  "20o-c": { languages: ["hu"] },
  "20o-d": { languages: ["hu"] },
  "20o-e": { languages: ["hu"] },
} satisfies Record<StrategyGameId, StrategyGameInfo>;

export type StrategyGameKey = keyof typeof strategyGames;

// Each game's own state type, on the `game` entry so a year's game can type its
// board against it. Nothing in this repo reads it — the consumer is the year's
// private repo, which a sweep of this one cannot see.
export interface StrategyGameStates {
  "20o-c": GameState20ocde;
  "20o-d": GameState20ocde;
  "20o-e": GameState20ocde;
}

export const MyGameWrappers = {
  "20o-c": () => GameWrapper20ocde("C"),
  "20o-d": () => GameWrapper20ocde("D"),
  "20o-e": () => GameWrapper20ocde("E"),
} satisfies Record<StrategyGameKey, unknown>;

export const strategyNames = {
  // need to be unique even if the game is the same
  // should also match up with the name defined in game.ts
  "20o-c": "20oc",
  "20o-d": "20od",
  "20o-e": "20oe",
} satisfies Record<StrategyGameKey, string>;

// The game each category plays in the offline dry run, until it follows the
// registry (#137, step 10); the live round plays its competition's own game.
// The problem bank's competitions say the same, and a test holds the two
// together.
export const strategyGameOfCategory = {
  C: "20o-c",
  D: "20o-d",
  E: "20o-e",
} satisfies Record<CompetitionCategory, StrategyGameKey>;
