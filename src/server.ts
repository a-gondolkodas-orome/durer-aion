import { Server } from 'boardgame.io/server';
import { MyGame as TicTacToeGame } from './games/tictactoe/game';
import { MyGame as SuperstitiousCountingGame } from './games/superstitious-counting/game';
import { PostgresStore } from 'bgio-postgres';
import { env } from 'process';

const CONNECTION_STRING = env.DATABASE_URL || "posgresql://postgres:postgres@localhost:5432/postgres";

const server = Server({
    games: [
        TicTacToeGame,
        SuperstitiousCountingGame,
    ],
    db: new PostgresStore(CONNECTION_STRING),
})

const PORT = parseInt(env.PORT || "8000");
server.run(PORT);
