import { Client } from 'boardgame.io/react';
import { Local } from 'boardgame.io/multiplayer';
import type { RelayBoard } from 'common-frontend';
import type { GameRelay, MyGameState as RelayGameState } from 'game';
import { RelayWrapper } from 'game';
import botWrapper from './botwrapper';
import type { RelayMoveArgs } from 'relay-bot';
import type { BotStrategy } from './botwrapper';
import { handleGameReport } from './game-report';
// Through the package entry, not the src path: a deep import would load a
// second copy of the module, one the app's setLocalStorageNamespace never set.
import { relayMatchStorageKey } from 'common-frontend';
import type { ReactNode } from 'react';

export function ClientRelayWithBot(
  game: typeof GameRelay,
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
        storageKey: relayMatchStorageKey(game.name),
      }
    ),
    numPlayers: 2,
  });
}
