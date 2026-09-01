import { MyClient, MyClientRelay, MyOnlineClient, MyOnlineRelayClient } from "./myclient";
import type { RelayBoard } from "./myclient";
import type { StrategyBoard } from "./boardwrapper";
import type { ReactNode } from "react";
import { GameType } from "game";
import type { GameRelay } from "game";

export const ClientFactory = function<T_SpecificGameState> (
  game: GameType<T_SpecificGameState>,
  board: StrategyBoard<T_SpecificGameState>,
  description: ReactNode,
  serverUrl: string | undefined = undefined,
  ) {
  const Client = MyClient(game, board, description);
  const OnlineClient = MyOnlineClient(game, board, description, serverUrl);
  return {
    Client: function () {
      return (<>
        <Client />
      </>);
    },
    OnlineClient: function ({ credentials, matchID }: { credentials?: string, matchID?: string }) {
      return (<>
        <OnlineClient playerID='0' credentials={credentials} matchID={matchID} />
      </>);
    }
  };
};

export const ClientFactoryRelay = function (
  game: typeof GameRelay,
  board: RelayBoard,
  description: ReactNode,
  serverUrl: string | undefined = undefined,
  ) {
  const Client = MyClientRelay(game, board, description);
  const OnlineClient = MyOnlineRelayClient(game, board, description, serverUrl);
  return {
    Client: function () {
      return (<>
        <Client />
      </>);
    },
    OnlineClient: function ({ credentials, matchID }: { credentials?: string, matchID?: string }) {
      return (<>
        <OnlineClient playerID='0' credentials={credentials} matchID={matchID} />
      </>);
    }
  };
};
