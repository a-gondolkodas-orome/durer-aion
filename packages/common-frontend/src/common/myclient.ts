import { Client } from 'boardgame.io/react';
import type { BoardProps } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { gameWrapper, GameType } from 'game';
import { boardWrapper } from './boardwrapper';
import { withConnectionAlert } from '../client/components/ConnectionAlert';
import { Loading } from '../client/components/Loading';
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

// socket.io makes one reconnect attempt at a time, and one started while the
// network was down hangs until this timeout (default 20 s) before the next.
const socketOpts = { timeout: 5000 };

// Until the socket syncs with the server, boardgame.io shows its own
// placeholder, an English "connecting...", so the online clients name ours.
export function MyOnlineClient<T_SpecificGameState>(
  game: GameType<T_SpecificGameState>,
  board: StrategyBoard<T_SpecificGameState>,
  description: ReactNode,
  serverUrl: string | undefined = undefined,
) {
  return Client({
    game: gameWrapper(game),
    board: withConnectionAlert(boardWrapper(board, description)),
    multiplayer: SocketIO({ server: serverUrl, socketOpts }),
    loading: Loading,
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
    board: withConnectionAlert(board),
    multiplayer: SocketIO({ server: serverUrl, socketOpts }),
    loading: Loading,
  });
}
