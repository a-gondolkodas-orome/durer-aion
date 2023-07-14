import { Client } from 'boardgame.io/react';
import { Local, SocketIO } from 'boardgame.io/multiplayer';
import botWrapper from './botwrapper';
import { gameWrapper } from './gamewrapper';
import { boardWrapper } from './boardwrapper';
import { GameType } from './types';
import type {GameRelay} from '../games/relay/game';

export function MyClient<T_SpecificGameState>(
  game: GameType<T_SpecificGameState>,
  board: any,
  description: string
) { // TODO finish types
  return Client({
    game: gameWrapper(game),
    board: boardWrapper(board, description),
    numPlayers: 2,
  })
}

export function MyClientRelay<T_SpecificGameState >(
  game: typeof GameRelay,
  board: any,
  description: string
) { // TODO finish types
  return Client({
    game: game,
    board: board,
    numPlayers: 2,
  },)
}


export function MyClientWithBot<T_SpecificGameState >(
  game: GameType<T_SpecificGameState>,
  board: any,
  strategy: any,
  description: string
) { // TODO types
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

export function MyClientRelayWithBot<T_SpecificGameState >(
  game: typeof GameRelay,
  board: any,
  strategy: any,
  description: string) { // TODO types
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


export function MyOnlineClient<T_SpecificGameState >(
  game: GameType<T_SpecificGameState>,
  board: any,
  description: string) {
  return Client({
    game: gameWrapper(game),
    board: boardWrapper(board, description),
    multiplayer: SocketIO(),
  });
}

export function MyOnlineRelayClient<T_SpecificGameState >(
  game: typeof GameRelay,
  board: any,
  description: string) {
  return Client({
    game: game,
    board: board,
    multiplayer: SocketIO(),
  });
}
