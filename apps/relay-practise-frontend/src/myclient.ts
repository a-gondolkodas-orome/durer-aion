import { Client } from 'boardgame.io/react';
import type { RelayBoard } from 'common-frontend';
import type { MyGameState as RelayGameState, RelayMoveArgs } from 'game';
import { RelayWrapper } from 'game';
import botWrapper from './botwrapper';
import type { BotStrategy } from './botwrapper';
import { handleGameReport } from './game-report';
// Through the package entry, not the src path: a deep import would load a
// second copy of the module, one the app's setLocalStorageNamespace never set.
import { localWithBots, matchStorageKey } from 'common-frontend/core';
import type { ReactNode } from 'react';

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
    multiplayer: localWithBots(
      {
        bots: { '1': botWrapper(strategy) },
        storageKey: matchStorageKey(gameName),
      }
    ),
    numPlayers: 2,
  });
}
