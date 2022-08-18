import { Lobby } from 'boardgame.io/react';
import { MyGame as ChessBishopGame } from './games/chess-bishops/game';
import { MyBoard as ChessBishopBoard } from './games/chess-bishops/board';
import { MyGame as TicTacToeGame } from './games/tictactoe/game';
import { MyBoard as TicTacToeBoard } from './games/tictactoe/board';
import { MyGame as SuperstitiousCountingGame } from './games/superstitious-counting/game';
import { MyBoard as SuperstitiousCountingBoard } from './games/superstitious-counting/board';

const server = 'http://localhost:8000';

export default function () {
  return (
    <div>
      <h1>Lobby</h1>
      <Lobby gameServer={server} lobbyServer={server} gameComponents={[
        {
          game: TicTacToeGame,
          board: TicTacToeBoard
        },
        {
          game: SuperstitiousCountingGame,
          board: SuperstitiousCountingBoard
        },
        {
          game: ChessBishopGame,
          board: ChessBishopBoard
        }
      ]} />
    </div>
  );
};