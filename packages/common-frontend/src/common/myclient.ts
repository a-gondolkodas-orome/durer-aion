import { Client } from 'boardgame.io/react';
import type { BoardProps } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { gameWrapper, GameType } from 'game';
import { boardWrapper } from './boardwrapper';
import type { StrategyBoard } from './boardwrapper';
import type { ComponentType, ReactNode } from 'react';
import type { GameRelay, MyGameState as RelayGameState } from 'game';

/// The relay board is handed straight to boardgame.io, so it sees the plain
/// bgio props: the relay game carries its own timer instead of gameWrapper's.
export type RelayBoard = ComponentType<BoardProps<RelayGameState>>;

export function MyClient<T_SpecificGameState>(
  game: GameType<T_SpecificGameState>,
  board: StrategyBoard<T_SpecificGameState>,
  description: ReactNode
) {
  return Client({
    game: gameWrapper(game),
    board: boardWrapper(board, description),
    numPlayers: 2,
  });
}

export function MyClientRelay(
  game: typeof GameRelay,
  board: RelayBoard,
  _description: ReactNode
) {
  return Client({
    game: game,
    board: board,
    numPlayers: 2,
  });
}

export function MyOnlineClient<T_SpecificGameState>(
  game: GameType<T_SpecificGameState>,
  board: StrategyBoard<T_SpecificGameState>,
  description: ReactNode,
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
  board: RelayBoard,
  description: ReactNode,
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
