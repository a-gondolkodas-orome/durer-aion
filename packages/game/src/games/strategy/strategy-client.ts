// The client half of the registries — see strategy-games.ts.
import type { ReactNode } from "react";
import type { BoardProps } from "boardgame.io/react";
import type { Localizable } from "schemas";
import { strategyClient as client20ocde } from "./20ocde/client";
import { strategyClient as clientKetkupac } from "./ketkupac/client";
import { strategyClient as clientSablon } from "./sablon/client";
import type { GameStateMixin, GameType } from "../../common/types";
import type { StrategyGameKey, StrategyGameStates } from "./strategy-games";

/// `board` is bare: boardWrapper adds the clock and the buttons around it.
export interface StrategyClientParts<G> {
  game: GameType<G>;
  board: (props: BoardProps<G & GameStateMixin>) => ReactNode;
  description: Localizable<ReactNode>;
}

const clients: { [K in StrategyGameKey]: () => StrategyClientParts<StrategyGameStates[K]> } = {
  "20o-c": () => client20ocde("C"),
  "20o-d": () => client20ocde("D"),
  "20o-e": () => client20ocde("E"),
  "minta-ketkupac": () => clientKetkupac(),
  "minta-sablon": () => clientSablon(),
};

// Generic, so a caller keeps one game's state type rather than a union.
export function strategyClientFor<K extends StrategyGameKey>(gameId: K): StrategyClientParts<StrategyGameStates[K]> {
  return clients[gameId]();
}
