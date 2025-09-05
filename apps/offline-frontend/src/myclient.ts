import { Client } from 'boardgame.io/react';
import { Local } from 'boardgame.io/multiplayer';
import { gameWrapper, GameStateMixin, GameType } from 'game';
import { boardWrapper } from 'common-frontend';
import type {GameRelay} from 'game';
import { State } from 'boardgame.io';
import botWrapper from './botwrapper';
//import { Debug } from 'boardgame.io/debug';

export function ClientWithBot<T_SpecificGameState,T_SpecificPosition>(
  game: GameType<T_SpecificGameState>,
  board: any,
  strategy: (state: State<T_SpecificGameState & GameStateMixin>, botID: string)=>[T_SpecificPosition | undefined, string],
  description: string
  ){ // TODO: types
  return Client({
    game: gameWrapper(game),
    board: boardWrapper(board, description),
    multiplayer: Local(
      {
        bots: { '1': botWrapper(strategy) }
      }
    ),
    numPlayers: 2,
    //debug: { impl: Debug },
  })
}

export function ClientRelayWithBot(
  game: typeof GameRelay,
  board: any,
  strategy: any, //TODO: type (?)
  description: string){ // TODO: types
  return Client({
    game: game,
    board: board,
    multiplayer: Local(
      {
        bots: { '1': botWrapper(strategy) }
      }
    ),
    numPlayers: 2,
    //debug: { impl: Debug },
  })
}
