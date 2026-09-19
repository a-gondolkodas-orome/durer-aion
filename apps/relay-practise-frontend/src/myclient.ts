import { Client } from 'boardgame.io/react';
import type { RelayBoard } from 'common-frontend';
import type { GameRelay, MyGameState as RelayGameState } from 'game';
import { RelayWrapper } from 'game';
import botWrapper from './botwrapper';
import type { BotStrategy } from './botwrapper';
import { handleGameReport } from './game-report';
// Through the package entry, not the src path: a deep import would load a
// second copy of the module, one the app's setLocalStorageNamespace never set.
import { bgioStoragePrefix, localWithBots } from 'common-frontend';
import type { ReactNode } from 'react';
//import { Debug } from 'boardgame.io/debug';

export function ClientRelayWithBot(
  game: typeof GameRelay,
  board: RelayBoard,
  // The relay bot answers with the next problem's text, points and image URL,
  // so its move args are that mixed tuple rather than a position.
  strategy: BotStrategy<RelayGameState, (number | string | boolean)[]>,
  _description: ReactNode) {
  return Client({
    game: RelayWrapper(handleGameReport),
    board: board,
    multiplayer: localWithBots(
      {
        bots: { '1': botWrapper(strategy) },
        storageKey: bgioStoragePrefix() + game.name,
      }
    ),
    numPlayers: 2,
    //debug: { impl: Debug },
  });
}
