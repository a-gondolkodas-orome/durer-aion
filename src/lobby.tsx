import { Lobby } from 'boardgame.io/react';
import { MyGame as ChessBishopGame } from './games/chess-bishops/game';
import { MyBoard as ChessBishopBoard } from './games/chess-bishops/board';
import { MyGame as TicTacToeGame } from './games/tictactoe/game';
import { MyBoard as TicTacToeBoard } from './games/tictactoe/board';
import { MyGame as SuperstitiousCountingGame } from './games/superstitious-counting/game';
import { MyBoard as SuperstitiousCountingBoard } from './games/superstitious-counting/board';
import { gameWrapper } from './common/gamewrapper';
import { boardWrapper } from './common/boardwrapper';

// TODO use Nginx as a proxy
const server = `http://${window.location.host}`; // DO NOT use trailing slash!
console.assert(!server.endsWith('/'));

export default function () {
  return (
    <div>
      <h1>Lobby</h1>
      <Lobby gameServer={server} lobbyServer={server} gameComponents={[
        {
          game: gameWrapper(TicTacToeGame),
          board: boardWrapper(TicTacToeBoard, "TODO")
        },
        {
          game: gameWrapper(SuperstitiousCountingGame),
          board: boardWrapper(SuperstitiousCountingBoard, "TODO")
        },
        {
          game: gameWrapper(ChessBishopGame),
          board: boardWrapper(ChessBishopBoard, "TODO")
        }
      ]} />
    </div>
  );
};