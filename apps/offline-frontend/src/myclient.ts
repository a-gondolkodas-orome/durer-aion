import { Client } from 'boardgame.io/react';
import { Local } from 'boardgame.io/multiplayer';
import { gameWrapper, GameStateMixin, GameType } from 'game';
import { boardWrapper, relayMatchStorageKey, strategyMatchStorageKey } from 'common-frontend';
import type { RelayBoard, StrategyBoard } from 'common-frontend';
import type { MyGameState as RelayGameState, RelayMoveArgs } from 'game';
import { RelayWrapper } from 'game';
import { State } from 'boardgame.io';
import botWrapper from './botwrapper';
import type { BotStrategy } from './botwrapper';
import { handleGameReport } from './game-report';
import type { ReactNode } from 'react';

export function ClientWithBot<T_SpecificGameState, T_SpecificPosition>(
  game: GameType<T_SpecificGameState> & { name: string },
  board: StrategyBoard<T_SpecificGameState>,
  strategy: (state: State<T_SpecificGameState & GameStateMixin>, botID: string) => [T_SpecificPosition | undefined, string],
  description: ReactNode
  ) {
  // The same key to both: what `Local` persists the match log under is what
  // the step files report as the match's log.
  const storageKey = strategyMatchStorageKey(game.name);
  return Client({
    game: gameWrapper(game, (report) => handleGameReport(report, storageKey)),
    board: boardWrapper(board, description),
    multiplayer: Local(
      {
        bots: { '1': botWrapper(strategy) },
        persist: true,
        storageKey,
      }
    ),
    numPlayers: 2,
  });
}

// Only the name is the caller's: RelayWrapper builds the game itself, and the
// name keys the saved match.
export function ClientRelayWithBot(
  gameName: string,
  board: RelayBoard,
  strategy: BotStrategy<RelayGameState, RelayMoveArgs>,
  _description: ReactNode) {
  return Client({
    game: RelayWrapper(handleGameReport),
    board: board,
    multiplayer: Local(
      {
        bots: { '1': botWrapper(strategy) },
        persist: true,
        storageKey: relayMatchStorageKey(gameName),
      }
    ),
    numPlayers: 2,
  });
}
