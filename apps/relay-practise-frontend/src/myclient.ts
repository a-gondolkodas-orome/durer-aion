import { Client } from 'boardgame.io/react';
import { Local } from 'boardgame.io/multiplayer';
import type { RelayBoard } from 'common-frontend';
import type { MyGameState as RelayGameState, RelayMoveArgs } from 'game';
import { RelayWrapper } from 'game';
import botWrapper from './botwrapper';
import type { BotStrategy } from './botwrapper';
import { handleGameReport } from './game-report';
// Through the package entry, not the src path: a deep import would load a
// second copy of the module, one the app's setLocalStorageNamespace never set.
import { relayMatchStorageKey } from 'common-frontend';
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
