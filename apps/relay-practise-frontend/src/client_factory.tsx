import { ClientRelayWithBot } from "./myclient";
import type { GameRelay, MyGameState as RelayGameState } from "game";
import type { RelayBoard } from "common-frontend";
import type { RelayMoveArgs } from "relay-bot";
import type { BotStrategy } from "./botwrapper";
import type { ReactNode } from "react";

export const ClientFactoryRelay = function (
  game: typeof GameRelay,
  board: RelayBoard,
  strategy: BotStrategy<RelayGameState, RelayMoveArgs>,
  description: ReactNode,
  ) {
  const ClientWithBotComponent = ClientRelayWithBot(game, board, strategy, description);
  return {
    ClientWithBot: function () {
      return (<>
        <ClientWithBotComponent playerID='0' />
      </>);
    },
  };
};
