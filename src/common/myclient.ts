import { Client } from 'boardgame.io/react';
import { Local, SocketIO } from 'boardgame.io/multiplayer';
import botWrapper from './botwrapper';
import { gameWrapper } from './gamewrapper';
import { boardWrapper } from './boardwrapper';
import { Debug } from 'boardgame.io/debug';


export function MyClient(game: any, board: any, description: any) { // TODO types
  return Client({
    game: gameWrapper(game),
    board: boardWrapper(board, description),
    numPlayers: 2,
  })
}

export function MyClientRelay(game: any, board: any, description: any) { // TODO types
  return Client({
    game: game,
    board: board,
    numPlayers: 2,
  })
}


export function MyClientWithBot(game: any, board: any, strategy: any, description: any) { // TODO types
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

export function MyClientRelayWithBot(game: any, board: any, strategy: any, description: any) { // TODO types
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


export function MyOnlineClient(game: any, board: any, description: string) {
  return Client({
    board: boardWrapper(board, description),
    game: gameWrapper(game),
    multiplayer: SocketIO(),
  });
}

export function MyOnlineRelayClient(game: any, board: any, description: string) {
  return Client({
    board: board,
    game: gameWrapper(game),
    multiplayer: SocketIO(),
  });
}
