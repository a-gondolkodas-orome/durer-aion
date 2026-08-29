import { ClientRelayWithBot } from "./myclient";
import type { GameRelay, MyGameState as RelayGameState } from "game";
import type { RelayBoard } from "common-frontend";
import type { BotStrategy } from "./botwrapper";
import type { ReactNode } from "react";

export const ClientFactoryRelay = function (
  game: typeof GameRelay,
  board: RelayBoard,
  strategy: BotStrategy<RelayGameState, (number | string | boolean)[]>,
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
