// The strategy games' registries, one per package entry. This one is the game
// definitions (`game/strategy`). The bots live in strategy-bots.ts (the `game/bot` entry) and the
// boards and descriptions in strategy-client.ts (`game/client`), and each
// registry imports a game folder's *files*, never a folder barrel — a barrel
// re-exporting `strategy` next to `board` is what would hand the bot to the
// live client again. ESLint holds each registry to the files it may import
// (eslint.config.mjs).
import type { StrategyGameId, StrategyGameInfo } from "schemas";
import type { GameType } from "../../common/types";
import { MyGameWrapper as GameWrapper20ocde } from "./20ocde/game";
import type { MyGameState as GameState20ocde } from "./20ocde/game";
import { MyGameWrapper as GameWrapperKetkupac } from "./ketkupac/game";
import type { MyGameState as GameStateKetkupac } from "./ketkupac/game";
import { MyGameWrapper as GameWrapperSablon } from "./sablon/game";
import type { MyGameState as GameStateSablon } from "./sablon/game";

// The strategy games a competition can name (`StrategyConfig.gameId`), each a
// game in one variant, and the languages its board and description exist in.
// Every other registry, here and in the other two entries, is keyed the same.
export const strategyGames = {
  "20o-c": { languages: ["hu"] },
  "20o-d": { languages: ["hu"] },
  "20o-e": { languages: ["hu"] },
  // The reference games (banks/reference.ts), which no competition was held
  // with: the platform's own test bed.
  "minta-ketkupac": { languages: ["hu"] },
  "minta-sablon": { languages: ["hu", "en"] },
} satisfies Record<StrategyGameId, StrategyGameInfo>;

export type StrategyGameKey = keyof typeof strategyGames;

// The game folder whose client.tsx plays each id, and its variant (#643).
export const strategyGameClients = {
  "20o-c": { folder: "20ocde", variant: "C" },
  "20o-d": { folder: "20ocde", variant: "D" },
  "20o-e": { folder: "20ocde", variant: "E" },
  "minta-ketkupac": { folder: "ketkupac" },
  "minta-sablon": { folder: "sablon" },
} satisfies Record<StrategyGameKey, { folder: string; variant?: string }>;

// Each game's own state type. The registries below, and the other two entries,
// are typed by it, so that a caller generic over the game id keeps one game's
// rules, board and bot together: indexed by a plain StrategyGameKey they would
// be a union of games, which no single game's client accepts.
export interface StrategyGameStates {
  "20o-c": GameState20ocde;
  "20o-d": GameState20ocde;
  "20o-e": GameState20ocde;
  "minta-ketkupac": GameStateKetkupac;
  "minta-sablon": GameStateSablon;
}

export const MyGameWrappers: { [K in StrategyGameKey]: () => GameType<StrategyGameStates[K]> } = {
  "20o-c": () => GameWrapper20ocde("C"),
  "20o-d": () => GameWrapper20ocde("D"),
  "20o-e": () => GameWrapper20ocde("E"),
  "minta-ketkupac": () => GameWrapperKetkupac(),
  "minta-sablon": () => GameWrapperSablon(),
};
