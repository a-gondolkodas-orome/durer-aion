import { Game } from 'boardgame.io';
import { INVALID_MOVE } from 'boardgame.io/core';

export interface MyGameState {
	board: Array<null | string>;
}

export const MyGame: Game<any> = { // TOOO: solve type
	setup: () => ({ board: Array(64).fill(null)}),
	moves: {
		clickCell: ({ G, ctx, playerID }, cellID: number) => {
			if (G.board[cellID] !== null) {
				return INVALID_MOVE;
			}
			G.board[cellID] = "forbidden";
			[-9,-7,7,9].forEach(element => {
				let i = 1;
				while(cellID+element*i >= 0 && cellID+element*i < 64) {
					G.board[cellID+element*i] = "forbidden";
					i++;
				}
			});

			if (IsVictory(G.board)) {
				G.winner = ctx.currentPlayer;
			}
		},
	},
	ai: {
		enumerate: (G, ctx, playerID) => {
			let moves = [];
			for (let i = 0; i < 64; i++) {
				if (G.board[i] === null) {
					moves.push({ move: 'clickCell', args: [i] });
				}
			}
			return moves;
		},
	},
};

// Return true if `cells` is in a winning configuration.
function IsVictory(cells: Array<null | string>) {
	return !cells.some(i => i === null);
}