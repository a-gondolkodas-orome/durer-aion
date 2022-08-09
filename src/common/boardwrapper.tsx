import { BoardProps } from "boardgame.io/dist/types/packages/react";

export function boardWrapper(board : any) { // TODO: solve types with BoardProps<MyGameState>
	return ({ G, ctx, moves } : any) => {
        return(
            <div>
                <h1>boardgame.io Typescript Demo</h1>
                <div>
                    <button
                    onClick={() => moves.chooseNewGameType()}
                    >Új játék kezdése</button>
                </div>
                <div>
                    <button
                    onClick={() => moves.chooseRole(0)}
                    >Kezdő leszek</button>
                    <button
                    onClick={() => moves.chooseRole(1)}
                    >Második leszek</button>
                </div>                
                {board({ G, ctx, moves })}
                {G.winner && <p>{G.winner}</p>}
            </div>
        );
    };
};