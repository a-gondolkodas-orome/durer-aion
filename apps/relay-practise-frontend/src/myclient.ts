import { Client } from 'boardgame.io/react';
import { Local } from 'boardgame.io/multiplayer';
import { gameWrapper, GameStateMixin, GameType } from 'game';
import { boardWrapper } from 'common-frontend';
import type { RelayBoard, StrategyBoard } from 'common-frontend';
import type {GameRelay, MyGameState as RelayGameState} from 'game';
import { RelayWrapper } from 'game';
import { State } from 'boardgame.io';
import botWrapper from './botwrapper';
import type { BotStrategy } from './botwrapper';
import { sendGameData } from './sendData';
// Through the package entry, not the src path: a deep import would load a
// second copy of the module, one the app's setLocalStorageNamespace never set.
import { bgioStoragePrefix } from 'common-frontend';
import type { ReactNode } from 'react';
//import { Debug } from 'boardgame.io/debug';

export function ClientWithBot<T_SpecificGameState,T_SpecificPosition>(
  game: GameType<T_SpecificGameState>,
  board: StrategyBoard<T_SpecificGameState>,
  strategy: (state: State<T_SpecificGameState & GameStateMixin>, botID: string)=>[T_SpecificPosition | undefined, string],
  description: ReactNode
  ){
  return Client({
    game: gameWrapper(game, sendGameData),
    board: boardWrapper(board, description),
    multiplayer: Local(
      {
        bots: { '1': botWrapper(strategy) },
        persist: true,
        storageKey: bgioStoragePrefix() + game.name,
      }
    ),
    numPlayers: 2,
    //debug: { impl: Debug },
  });
}

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
        storageKey: bgioStoragePrefix() + game.name,
      }
    ),
    numPlayers: 2,
    //debug: { impl: Debug },
  });
}
