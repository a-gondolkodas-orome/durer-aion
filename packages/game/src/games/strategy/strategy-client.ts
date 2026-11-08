// The client half of the registries — see strategy-games.ts. The frontends
// import this through the `game/client` entry; the server never does.
import type { ReactNode } from "react";
import type { Localized } from "schemas";
import { MyBoard as Board20ocde } from "./20ocde/board";
import { descriptionC as description20oc, descriptionD as description20od, descriptionE as description20oe } from "./20ocde/main";
import type { StrategyGameKey } from "./strategy-games";

const boards = {
  "20o-c": Board20ocde,
  "20o-d": Board20ocde,
  "20o-e": Board20ocde,
} satisfies Record<StrategyGameKey, unknown>;

// The rules text shown above the board, in each of the game's languages
// (`strategyGames`).
export const strategyDescriptions = {
  "20o-c": { hu: description20oc },
  "20o-d": { hu: description20od },
  "20o-e": { hu: description20oe },
} satisfies Record<StrategyGameKey, Localized<ReactNode>>;

// Generic over the game so the caller keeps the board's own state type: a
// plain StrategyGameKey parameter would widen the result to a union of boards,
// which no single game's client can accept.
export function MyBoardWrapper<T_Game extends StrategyGameKey>(gameId: T_Game): (typeof boards)[T_Game] {
  return boards[gameId];
}
