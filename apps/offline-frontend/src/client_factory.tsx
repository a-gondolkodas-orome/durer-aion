import { State } from "boardgame.io";
import { ClientRelayWithBot, ClientWithBot } from "./myclient";
import { GameStateMixin, GameType } from "game";
import type { MyGameState as RelayGameState, RelayMoveArgs } from "game";
import type { RelayBoard, StrategyBoard } from "common-frontend";
import type { BotStrategy } from "./botwrapper";
import type { ReactNode } from "react";

export const ClientFactory = function<
T_SpecificGameState
, T_SpecificPosition> (
  game: GameType<T_SpecificGameState> & { name: string },
  board: StrategyBoard<T_SpecificGameState>,
  strategy: (state: State<T_SpecificGameState & GameStateMixin>, botID: string) => [T_SpecificPosition | undefined, string],
  description: ReactNode
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

export const ClientFactoryRelay = function (
  gameName: string,
  board: RelayBoard,
  strategy: BotStrategy<RelayGameState, RelayMoveArgs>,
  description: ReactNode,
  ) {
  const ClientWithBotComponent = ClientRelayWithBot(gameName, board, strategy, description);
  return {
    ClientWithBot: function () {
      return (<>
        <ClientWithBotComponent playerID='0' />
      </>);
    },
  };
};
