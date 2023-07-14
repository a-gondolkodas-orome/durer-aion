import React, { useState } from 'react';
import { range, cloneDeep, isNull } from 'lodash';
import { strategyGameFactory } from '../strategy-game';
import { getGameStateAfterMove, getGameStateAfterAiTurn, playerColor } from './strategy';
import { generateEmptyTicTacToeBoard } from './helpers';
import { RockSvg } from './rock-svg';
import { PaperSvg } from './paper-svg';
import { ScissorSvg } from './scissor-svg';

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
  const pieceColor = (id) => {
    const colorCode = board[id];
    if (colorCode === 'red') return 'bg-red-600';
    return 'bg-blue-600';
  };

  return (
  <section className="p-2 shrink-0 grow basis-2/3">
    <div className="grid grid-cols-3 gap-100 border-2">
      {range(9).map(id => (
        <button
          key={id}
          disabled={id === 1 || id === 4 || id === 7 || (ctx.playerIndex === 0 && (id == 0 || id == 3 || id == 6)) || (ctx.playerIndex == 1 && (id == 2 || id == 5 || id == 8))}
          onClick={() => clickField(id)}
          className="aspect-square p-[25%] border-2"
        >
          
          
          
          { // board[id] && (
          //  <span
          //</button>    className={`w-full aspect-square inline-block rounded-full mb-[-0.5rem] ${pieceColor(id)}`}
          //  ></span>
          // )
          }
          
          { isNull(board[id]) && (id === 0 || id === 2) && (
            <RockSvg />
          )}
          { isNull(board[id]) && (id === 3 || id === 5) && (
            <PaperSvg />
          )}
          { isNull(board[id]) && (id === 6 || id === 8) && (
            <ScissorSvg />
          )}
      </button>
      ))}
    </div>
  </section>
  );
};

const rule = <>
  A játék kezdetekor mindkét játékos elé leteszünk három kártyát: az egyik követ, a
másik papírt, a harmadik ollót ábrázol. Ezután a játkosok felváltva elvesznek egy-egy lapot az
ellenfelük elől, egészen addig, amíg már csak egy-egy lap marad. Ekkor a megmaradt kártyákat
ütköztetik a „kő-papír-olló” játék szabályai szerint, így eldöntve, hogy ki a győztes; ha mindkét
kártyán ugyanaz van, akkor a Kezdő nyert. Sok sikert :):)

</>;

const Game = strategyGameFactory({
  rule,
  title: 'Kő Papír Olló',
  GameBoard,
  G: {
    getPlayerStepDescription: () => 'Távolíts el egy ellenséges tárgyat',
    generateNewBoard: generateEmptyTicTacToeBoard,
    getGameStateAfterAiTurn
  }
});

export const RockPaperScissor = () => {
  const [board, setBoard] = useState(generateEmptyTicTacToeBoard());

  return <Game board={board} setBoard={setBoard} />;
};
