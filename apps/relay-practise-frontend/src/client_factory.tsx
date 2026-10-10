import { ClientRelayWithBot } from "./myclient";
import type { MyGameState as RelayGameState, RelayMoveArgs } from "game";
import type { RelayBoard } from "common-frontend";
import type { BotStrategy } from "./botwrapper";
import type { ReactNode } from "react";

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
