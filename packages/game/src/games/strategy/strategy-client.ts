// The client half of the registries — see strategy-games.ts. The frontends
// import this through the `game/client` entry; the server never does.
// Each game folder's client.tsx is its rules, board and description together,
// which is the unit the live round is to serve on its own (#643).
import type { ReactNode } from "react";
import type { BoardProps } from "boardgame.io/react";
import type { Localizable } from "schemas";
import { strategyClient as client20ocde } from "./20ocde/client";
import { strategyClient as clientKetkupac } from "./ketkupac/client";
import { strategyClient as clientSablon } from "./sablon/client";
import type { GameStateMixin, GameType } from "../../common/types";
import type { StrategyGameKey, StrategyGameStates } from "./strategy-games";

/// A game as the browser plays it. `board` is the game's own board, bare:
/// boardWrapper puts the clock, the role and next-game buttons around it where
/// each client is built. `description` is the rules text shown above the
/// board: one for every language, or one per language the game lists
/// (`strategyGames`).
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

// Generic over the game so the caller keeps its own state type: a plain
// StrategyGameKey parameter would widen the result to a union of games, which
// no single game's client can accept.
export function strategyClientFor<K extends StrategyGameKey>(gameId: K): StrategyClientParts<StrategyGameStates[K]> {
  return clients[gameId]();
}
