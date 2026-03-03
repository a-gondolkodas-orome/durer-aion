import { MyClient, MyClientRelay, MyOnlineClient, MyOnlineRelayClient } from "./myclient";
import { GameType } from "game";

export const ClientFactory = function<T_SpecificGameState> (
  game: GameType<T_SpecificGameState>, 
  board: any,
  description: any,
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

export const ClientFactoryRelay = function (game: any, board: any, description: any, serverUrl: string | undefined = undefined) {
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
