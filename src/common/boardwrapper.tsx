export function boardWrapper(board: any, description: any) { // TODO: solve types with BoardProps<MyGameState>
  return ({ G, ctx, moves, log }: any) => {
    return (
      <div>
        <h1>boardgame.io Typescript Demo</h1>
        <p>{description}</p>
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
        {ctx.phase === 'startNewGame' && G.winner === null && <p> Kezdj új játékot! </p>}
        {ctx.phase === 'chooseRole' && <p> Válaszd ki, hogy első vagy második játékos akarsz-e lenni. </p>}
        {ctx.phase === 'play' && ctx.currentPlayer === "0" && <p> Most Te jössz! </p>}
        {ctx.phase === 'play' && ctx.currentPlayer === "1" && <p> Várakozás a szerverre... </p>}
        {ctx.phase === 'startNewGame' && G.winner === "0" && <p> Gratulálok, nyertetek! </p>}
        {ctx.phase === 'startNewGame' && G.winner === "1" && <p> Sajnos a gép nyert. </p>}
        {board({ G, ctx, moves })}
        {G.winner && <p>{G.winner}</p>}
      </div>
    );
  };
};