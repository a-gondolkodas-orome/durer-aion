import { Client } from 'boardgame.io/react';
import { Local } from 'boardgame.io/multiplayer';
import type { RelayBoard } from 'common-frontend';
import type {GameRelay, MyGameState as RelayGameState} from 'game';
import { RelayWrapper } from 'game';
import botWrapper from './botwrapper';
import type { BotStrategy } from './botwrapper';
import { sendGameData } from './sendData';
import { BGIO_LOCALSTORAGE_PREFIX } from 'common-frontend/src/client/utils/util';
import type { ReactNode } from 'react';
//import { Debug } from 'boardgame.io/debug';

export function ClientRelayWithBot(
  game: typeof GameRelay,
  board: RelayBoard,
  // The relay bot answers with the next problem's text, points and image URL,
  // so its move args are that mixed tuple rather than a position.
  strategy: BotStrategy<RelayGameState, (number | string | boolean)[]>,
  _description: ReactNode){
  return Client({
    game: RelayWrapper(sendGameData),
    board: board,
    multiplayer: Local(
      {
        bots: { '1': botWrapper(strategy) },
        persist: true,
        storageKey: BGIO_LOCALSTORAGE_PREFIX + game.name,
      }
    ),
    numPlayers: 2,
    //debug: { impl: Debug },
  });
}
