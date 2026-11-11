// The client half of the registries — see strategy-games.ts. The frontends
// import this through the `game/client` entry; the server never does.
import type { ReactNode } from "react";
import type { Localizable } from "schemas";
import { MyBoard as Board20ocde } from "./20ocde/board";
import { presentationC as presentation20oc, presentationD as presentation20od, presentationE as presentation20oe } from "./20ocde/main";
import type { StrategyGameKey } from "./strategy-games";

const boards = {
  "20o-c": Board20ocde,
  "20o-d": Board20ocde,
  "20o-e": Board20ocde,
} satisfies Record<StrategyGameKey, unknown>;

// What the strategy wrapper shows around each board that only the game knows:
// its rules, one for every language or one per language the game lists
// (`strategyGames`), its role names and whether its opening position varies.
export const strategyPresentations = {
  "20o-c": presentation20oc,
  "20o-d": presentation20od,
  "20o-e": presentation20oe,
} satisfies Record<StrategyGameKey, { rules: Localizable<ReactNode> }>;

// Generic over the game so the caller keeps the board's own state type: a
// plain StrategyGameKey parameter would widen the result to a union of boards,
// which no single game's client can accept.
export function MyBoardWrapper<T_Game extends StrategyGameKey>(gameId: T_Game): (typeof boards)[T_Game] {
  return boards[gameId];
}
