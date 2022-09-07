import { MyClient, MyClientWithBot } from "./myclient";

export const ClientFactory = function (game: any, board: any, strategy: any, description: any) {
  const Client = MyClient(game, board, description);
  const ClientWithBot = MyClientWithBot(game, board, strategy, description);
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
    }
  };
};
