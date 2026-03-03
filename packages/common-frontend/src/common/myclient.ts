import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { gameWrapper, GameType } from 'game';
import { boardWrapper } from './boardwrapper';
import type {GameRelay} from 'game';

export function MyClient<T_SpecificGameState>(
  game: GameType<T_SpecificGameState>,
  board: any,
  description: string
) { // TODO: finish types
  return Client({
    game: gameWrapper(game),
    board: boardWrapper(board, description),
    numPlayers: 2,
  })
}

export function MyClientRelay(
  game: typeof GameRelay,
  board: any,
  description: string
) { // TODO: finish types
  return Client({
    game: game,
    board: board,
    numPlayers: 2,
  },)
}

export function MyOnlineClient<T_SpecificGameState >(
  game: GameType<T_SpecificGameState>,
  board: any,
  description: string,
  serverUrl: string | undefined = undefined,
) {
  return Client({
    game: gameWrapper(game),
    board: boardWrapper(board, description),
    multiplayer: serverUrl === undefined ? SocketIO() :
      SocketIO({ server: serverUrl }),
    //debug: { impl: Debug },
  });
}

export function MyOnlineRelayClient(
  game: typeof GameRelay,
  board: any,
  description: string,
  serverUrl: string | undefined = undefined
) {
  return Client({
    game: game,
    board: board,
    multiplayer: serverUrl === undefined ? SocketIO() :
      SocketIO({ server: serverUrl }),
    //debug: { impl: Debug },
  });
}
