import { MyOnlineClient, MyOnlineRelayClient } from "./myclient";
import type { RelayBoard } from "./myclient";
import type { StrategyBoard, StrategyDescription } from "./boardwrapper";
import type { ReactNode } from "react";
import { GameType } from "game";
import type { GameRelay } from "game";

// The live round's clients; the team always plays as player 0.
export const ClientFactory = function<T_SpecificGameState> (
  game: GameType<T_SpecificGameState> & { name: string },
  board: StrategyBoard<T_SpecificGameState>,
  description: StrategyDescription,
  ) {
  const OnlineClient = MyOnlineClient(game, board, description);
  return function ({ credentials, matchID }: { credentials?: string, matchID?: string }) {
    return <OnlineClient playerID='0' credentials={credentials} matchID={matchID} />;
  };
};

export const ClientFactoryRelay = function (
  game: typeof GameRelay,
  board: RelayBoard,
  description: ReactNode,
  ) {
  const OnlineClient = MyOnlineRelayClient(game, board, description);
  return function ({ credentials, matchID }: { credentials?: string, matchID?: string }) {
    return <OnlineClient playerID='0' credentials={credentials} matchID={matchID} />;
  };
};
