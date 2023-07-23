import React, { useState } from 'react';
import { range, cloneDeep, isNull, max } from 'lodash';
import { strategyGameFactory } from '../strategy-game';
import { getGameStateAfterMove, getGameStateAfterAiTurn, playerColor } from './strategy';

const GameBoard = ({ board, ctx }) => {
  const isMoveAllowed = (id) => {
    if (!ctx.shouldPlayerMoveNext) return false;
    return board[id] === null;
  };
  const clickField = (id) => {
    if (!isMoveAllowed(id)) return;

    const newBoard = cloneDeep(board);
    newBoard[id] = playerColor(ctx.playerIndex);
    ctx.endPlayerTurn(getGameStateAfterMove(newBoard));
  };

  return (
  <section className="p-2 shrink-0 grow basis-2/3">
    <div className="cols-3">

      <button
          className="aspect-square"
          style={{width: "33%", aspectRatio: 0, color: "#AA98A9"}}
        >
          Kezdő
      </button>
      <button
          className="aspect-square"
          style={{width: "34%", aspectRatio: 0, color: "#AA98A9"}}
        >
      </button>
      <button
          className="aspect-square"
          style={{width: "33%", aspectRatio: 0, color: "#AA98A9"}}
        >
          Második
      </button>
    </div>
    <div className="grid grid-cols-3 gap-50 border-2">
      {range(15).map(id => (
        <button
          key={id}
          disabled={id % 3 == 1 || (ctx.playerIndex == 0 && id % 3 == 0) || (ctx.playerIndex == 1 && id % 3 == 2)}
          onClick={() => clickField(id)}
          className="aspect-square p-[25%] border-2"
          style={{aspectRatio: 0}}
        >
          { isNull(board[id]) && (id === 0 || id === 2) && (
            <p>1</p>
          )}
          { isNull(board[id]) && (id === 3 || id === 5) && (
            <p>2</p>
          )}
          { isNull(board[id]) && (id === 6 || id === 8) && (
            <p>3</p>
          )}
          { isNull(board[id]) && (id === 9 || id === 11) && (
            <p>4</p>
          )}
          { isNull(board[id]) && (id === 12 || id === 14) && (
            <p>5</p>
          )}
      </button>
      ))}
    </div>
  </section>
  );
};

const rule = <>
  Mindkét játékos elé leteszünk öt-öt kártyalapot, ezeken 1-től 5-ig az egész számok
szerepelnek. A játékosok felváltva elvesznek egy-egy lapot az ellenfelük elől, egészen addig, amíg
már csak egy-egy lap marad marad előttük. Ekkor vége van a játéknak. Ha a két megmaradt
szám összege páratlan, akkor az nyer, aki előtt a nagyobbik van; ha páros az összeg, akkor
pedig az, aki előtt a kisebbik (ha ugyanaz a szám marad meg a két játékos előtt, akkor az nyer,
aki kezdte a játékot). Sok sikert :):)

</>;

const Game = strategyGameFactory({
  rule,
  title: 'Öt-öt lap',
  GameBoard,
  G: {
    getPlayerStepDescription: () => 'Pusztíts el egy ellenséges számot',
    generateNewBoard: () => Array(15).fill(null),
    getGameStateAfterAiTurn
  }
});

export const FiveFiveCard = () => {
  const [board, setBoard] = useState(Array(15).fill(null));

  return <Game board={board} setBoard={setBoard} />;
};
