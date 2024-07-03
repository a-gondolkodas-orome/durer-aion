import React, { useState } from 'react';
import { range, random } from 'lodash';
import { strategyGameFactory } from '../strategy-game';
import { getOptimalAiMove } from './strategy';

const generateNewBoard = () => ([random(0, 9), random(0, 9), random(0, 9), random(4, 9)]);

const getGameStateAfterMove = (board, { pileId, pieceId }) => {
  const intermediateBoard = [...board];
  intermediateBoard[pileId]=board[pileId]-pieceId-1;

  const newBoard = [...board];
  newBoard[pileId]=board[pileId]-pieceId-1;
  for (let i=pileId-pieceId-1; i<pileId; i++){
    newBoard[i]=board[i]+1;
  }
  const isGameEnd = newBoard[1]===0 && newBoard[2]===0 && newBoard[3]===0;

  return { newBoard, intermediateBoard, isGameEnd, winnerIndex: null };
};

const GameBoard = ({ board, setBoard, ctx }) => {
  const [hoveredPiece, setHoveredPiece] = useState(null);

  const nonExistent = ({ pileId, pieceId }) => {
    return pieceId >= board[pileId];
  };

  const isDisabled = ({ pileId, pieceId }) => {
    if (!ctx.shouldPlayerMoveNext) return true;
    return pieceId>pileId-1 || (pieceId>board[pileId]-1);
  };

  const hoverPiece = (piece) => {
    if (piece === null) {
      setHoveredPiece(null);
      return;
    }
    if (isDisabled(piece)) return;
    setHoveredPiece(piece);
  }

  const clickPiece = ({ pileId, pieceId }) => {
    if (isDisabled({ pileId, pieceId })) return;

    ctx.endPlayerTurn(getGameStateAfterMove(board, { pileId, pieceId }));

    setHoveredPiece(null);
  };

  const toBeRemoved = ({ pileId, pieceId }) => {
    if (hoveredPiece === null) return false;
    if (pileId !== hoveredPiece.pileId) return false;
    if (pieceId > hoveredPiece.pieceId) return false;
    return true;
  };

  const toAppear = ({ pileId, pieceId }) => {
    if (hoveredPiece === null) return false;
    return (
      (pileId<hoveredPiece.pileId) &&
      (pileId>hoveredPiece.pileId-hoveredPiece.pieceId-2) &&
      (pieceId===board[pileId])
    );
  };

  const currentChoiceDescription = (pileId) => {
    const pieceCountInPile = board[pileId];

    if (!ctx.shouldPlayerMoveNext || !hoveredPiece) {
      return `${pileId+1}. kupac: ${pieceCountInPile} `;
    }

    if (pileId===hoveredPiece.pileId) {
      return `${pileId+1}. kupac: ${pieceCountInPile} → ${pieceCountInPile - hoveredPiece.pieceId - 1}`;
    }
    if ((pileId<hoveredPiece.pileId) && (pileId>hoveredPiece.pileId-hoveredPiece.pieceId-2)) {
      return `${pileId+1}. kupac: ${pieceCountInPile} → ${pieceCountInPile + 1}`;
    }
    return `${pileId+1}. kupac: ${pieceCountInPile} `;
  };

  return (
  <section className="p-2 shrink-0 grow basis-2/3">
    {[0, 1, 2, 3].map(pileId => (
      <div
        key={pileId}
        className={`w-[50%] pl-1 inline-block text-center`}
        style={{ transform: 'scaleY(-1)' }}
      >
        <p className="text-xl" style={{ transform: 'scaleY(-1)' }}>
          {currentChoiceDescription(pileId)}
        </p>
          {range(board[pileId]+5).map(pieceId => (
            <button
              key={pieceId}
              disabled={isDisabled({ pileId, pieceId })}
              className={`
                inline-block w-[20%] aspect-square rounded-full mx-0.5
                ${isDisabled({ pileId, pieceId }) && 'cursor-not-allowed'}
                ${toAppear({ pileId, pieceId }) ? 'bg-blue-900 opacity-30' : ''}
                ${toBeRemoved({ pileId, pieceId }) ? 'bg-red-600 opacity-50' : ''}
                ${(nonExistent({ pileId, pieceId }) && !toAppear({ pileId, pieceId })) ? 'bg-white' : ''}
                ${!nonExistent({ pileId, pieceId }) && !toBeRemoved({ pileId, pieceId }) ? 'bg-blue-900' : ''}
              `}
              onClick={() => clickPiece({ pileId, pieceId })}
              onFocus={() => hoverPiece({ pileId, pieceId })}
              onBlur={() => hoverPiece(null)}
              onMouseOver={() => hoverPiece({ pileId, pieceId })}
              onMouseOut={() => hoverPiece(null)}
            ></button>
          ))}
      </div>
    ))}
  </section>
  );
};

const rule = <>
  Adott négy, korongokból álló kupac, melyek 1-től 4-ig vannak számozva. Egy lépésben a
  soron következő játékos választ m és n egész számokat, melyekre 1 ≤ m &lt; n ≤ 4, majd az n sorszámú
  kupacból elvesz m korongot, és az n − 1, n − 2, . . . , n − m sorszámú kupacokba egyesével szétosztja az
  elvett korongokat. Az veszít, aki nem tud a szabályoknak megfelelően lépni.

  A kezdőállás ismeretében te döntheted el, hogy kezdeni szeretnél-e, vagy második játékos lenni.
  Sok sikert! :)
</>;

const Game = strategyGameFactory({
  rule,
  title: '4 kupacban előrepakolás',
  GameBoard,
  G: {
    getPlayerStepDescription: () => 'Kattints egy korongra, hogy jelezd, hány korongot szeretnél elvenni a kupacból.',
    generateNewBoard,
    getGameStateAfterAiTurn: ({ board }) => getGameStateAfterMove(board, getOptimalAiMove(board))
  }
});

export const FourPilesSpreadAhead = () => {
  const [board, setBoard] = useState(generateNewBoard());

  return <Game board={board} setBoard={setBoard} />;
};
