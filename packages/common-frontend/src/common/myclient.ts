import { Client } from 'boardgame.io/react';
import type { BoardProps } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { gameWrapper, GameType } from 'game';
import { boardWrapper } from './boardwrapper';
import { withConnectionAlert } from '../client/components/ConnectionAlert';
import { Loading } from '../client/components/Loading';
import type { StrategyBoard, StrategyDescription } from './boardwrapper';
import type { ComponentType, ReactNode } from 'react';
import type { GameRelay, MyGameState as RelayGameState } from 'game';

/// The relay board is handed straight to boardgame.io, so it sees the plain
/// bgio props: the relay game carries its own timer instead of gameWrapper's.
export type RelayBoard = ComponentType<BoardProps<RelayGameState>>;

// socket.io makes one reconnect attempt at a time, and one started while the
// network was down hangs until this timeout (default 20 s) before the next.
const socketOpts = { timeout: 5000 };

// Until the socket syncs with the server, boardgame.io shows its own
// placeholder, an English "connecting...", so the online clients name ours.
// The server serves each match under its name, so the live client needs the
// one its host gives the game.
export function MyOnlineClient<T_SpecificGameState>(
  game: GameType<T_SpecificGameState> & { name: string },
  board: StrategyBoard<T_SpecificGameState>,
  description: StrategyDescription,
  serverUrl: string | undefined = undefined,
) {
  return Client({
    game: gameWrapper(game),
    board: withConnectionAlert(boardWrapper(board, description, game)),
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
