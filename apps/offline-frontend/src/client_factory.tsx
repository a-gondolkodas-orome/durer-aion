import { State } from "boardgame.io";
import { ClientRelayWithBot, ClientWithBot } from "./myclient";
import { GameStateMixin, GameType } from "game";

export const ClientFactory = function<
T_SpecificGameState
,T_SpecificPosition> (
  game: GameType<T_SpecificGameState>, 
  board: any, 
  strategy: (state: State<T_SpecificGameState & GameStateMixin>, botID: string)=>[T_SpecificPosition | undefined, string], 
  description: any
  ) {
  const ClientWithBotComponent = ClientWithBot(game, board, strategy, description);
  return {
    ClientWithBot: function () {
      return (<>
        <ClientWithBotComponent playerID='0' />
      </>);
    },
  };
};

export const ClientFactoryRelay = function (game: any, board: any, strategy: any, description: any) {
  const ClientWithBotComponent = ClientRelayWithBot(game, board, strategy, description);
  return {
    ClientWithBot: function () {
      return (<>
        <ClientWithBotComponent playerID='0' />
      </>);
    },
  };
};
