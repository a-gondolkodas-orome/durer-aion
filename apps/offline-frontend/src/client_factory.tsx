import { State } from "boardgame.io";
import { ClientRelayWithBot, ClientWithBot } from "./myclient";
import { GameStateMixin, GameType } from "game";
import type { GameRelay, MyGameState as RelayGameState } from "game";
import type { RelayBoard, StrategyBoard } from "common-frontend";
import type { BotStrategy } from "./botwrapper";
import type { ReactNode } from "react";

export const ClientFactory = function<
T_SpecificGameState
, T_SpecificPosition> (
  game: GameType<T_SpecificGameState>,
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
