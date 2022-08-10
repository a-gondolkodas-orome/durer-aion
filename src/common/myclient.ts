import { Client } from 'boardgame.io/react';
import { Local } from 'boardgame.io/multiplayer';
import botWrapper from './botwrapper';
import { gameWrapper } from './gamewrapper';
import { boardWrapper } from './boardwrapper';


export function MyClient(game: any, board: any, strategy: any) { // TODO types
	return Client({
		game: gameWrapper(game),
		board: boardWrapper(board),
		multiplayer: Local(
			{
				bots: { '1': botWrapper(strategy) }
			}
		),
		numPlayers: 2,
	})
}