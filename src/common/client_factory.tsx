import { MyClient, MyClientRelay, MyClientRelayWithBot, MyClientWithBot, MyOnlineClient, MyOnlineRelayClient } from "./myclient";

export const ClientFactory = function (game: any, board: any, strategy: any, description: any) {
  const Client = MyClient(game, board, description);
  const ClientWithBot = MyClientWithBot(game, board, strategy, description);
  const OnlineClient = MyOnlineClient(game, board, description);
  return {
    Client: function () {
      return (<>
        <Client />
      </>);
    },
    ClientWithBot: function () {
      return (<>
        <ClientWithBot playerID='0' />
      </>);
    },
    OnlineClient: function ({ credentials, matchID }: { credentials: string, matchID: string }) {
      return (<>
        <OnlineClient playerID='0' credentials={credentials} matchID={matchID} />
      </>);
    }
  };
};

export const ClientFactoryRelay = function (game: any, board: any, strategy: any, description: any) {
  const Client = MyClientRelay(game, board, description);
  const ClientWithBot = MyClientRelayWithBot(game, board, strategy, description);
  const OnlineClient = MyOnlineRelayClient(game, board, description);
  return {
    Client: function () {
      return (<>
        <Client />
      </>);
    },
    ClientWithBot: function () {
      return (<>
        <ClientWithBot playerID='0' />
      </>);
    },
    OnlineClient: function ({ credentials, matchID }: { credentials: string, matchID: string }) {
      return (<>
        <OnlineClient playerID='0' credentials={credentials} matchID={matchID} />
      </>);
    }
  };
};
