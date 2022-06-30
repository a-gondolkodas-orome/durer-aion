import { Server } from 'boardgame.io/server';
import { MyGame as TicTacToeGame } from './games/tictactoe/game';
import { MyGame as SuperstitiousCountingGame } from './games/superstitious-counting/game';

const server = Server({
    games: [
        TicTacToeGame,
        SuperstitiousCountingGame,
    ],
})

server.run(8000);
