// The client half of the registries — see strategy-games.ts. The frontends
// import this through the `game/client` entry; the server never does.
import type { ReactNode } from "react";
import type { Localizable } from "schemas";
import { MyBoard as Board20ocde } from "./20ocde/board";
import { descriptionC as description20oc, descriptionD as description20od, descriptionE as description20oe } from "./20ocde/main";
import { MyBoard as BoardKetkupac } from "./ketkupac/board";
import { description as descriptionKetkupac } from "./ketkupac/main";
import { MyBoard as BoardSablon } from "./sablon/board";
import { description as descriptionSablon } from "./sablon/main";
import type { BoardProps } from "boardgame.io/react";
import type { GameStateMixin } from "../../common/types";
import type { StrategyGameKey, StrategyGameStates } from "./strategy-games";

const boards: { [K in StrategyGameKey]: (props: BoardProps<StrategyGameStates[K] & GameStateMixin>) => ReactNode } = {
  "20o-c": Board20ocde,
  "20o-d": Board20ocde,
  "20o-e": Board20ocde,
  "minta-ketkupac": BoardKetkupac,
  "minta-sablon": BoardSablon,
};

// The rules text shown above the board: one for every language, or one per
// language the game lists (`strategyGames`).
export const strategyDescriptions = {
  "20o-c": description20oc,
  "20o-d": description20od,
  "20o-e": description20oe,
  "minta-ketkupac": descriptionKetkupac,
  "minta-sablon": descriptionSablon,
} satisfies Record<StrategyGameKey, Localizable<ReactNode>>;

// The game's own board, bare: boardWrapper puts the clock, the role and
// next-game buttons around it where each client is built. Generic over the
// game so the caller keeps the board's own state type: a plain StrategyGameKey
// parameter would widen the result to a union of boards, which no single
// game's client can accept.
export function boardFor<T_Game extends StrategyGameKey>(gameId: T_Game): (typeof boards)[T_Game] {
  return boards[gameId];
}
