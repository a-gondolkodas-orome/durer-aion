import React, { useState } from 'react';
import { range, isEqual, random } from 'lodash';
import { strategyGameFactory } from '../../strategy-game';
import { getOptimalAiMove } from './strategy';

const generateStartBoard = () => ([random(3, 10), random(3, 10)]);

const getGameStateAfterMove = (board, { pileId, pieceId }) => {
  const intermediateBoard = pileId === 0
    ? [board[0] - pieceId - 1, board[1]]
    : [board[0], board[1]-pieceId-1];
  const nextBoard = pileId === 0
    ? [board[0] - pieceId - 1, board[1]+(pieceId+1)/2]
    : [board[0] +(pieceId+1)/2, board[1]-pieceId-1];
  const isGameEnd = isEqual(nextBoard, [1, 1]) || isEqual(nextBoard, [0, 1]) || isEqual(nextBoard, [1, 0]);

  return { nextBoard, intermediateBoard, isGameEnd, winnerIndex: null };
};

const GameBoard = ({ board, ctx }) => {
  const [hoveredPiece, setHoveredPiece] = useState(null);

  const nonExistent = ({ pileId, pieceId }) => {
    return pieceId >= board[pileId];
  };

  const isDisabled = ({ pileId, pieceId }) => {
    if (!ctx.shouldPlayerMoveNext) return true;
    return pieceId % 2 === 0 || (pieceId > board[pileId] - 1);
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
    if(pileId === hoveredPiece.pileId) return false;
    if(pieceId > board[pileId] + (hoveredPiece.pieceId + 1) / 2 - 1) return false;
    return true;
  };

  const currentChoiceDescription = (pileId) => {
    const pieceCountInPile = board[pileId];

    if (!ctx.shouldPlayerMoveNext) return pieceCountInPile;
    if (!hoveredPiece) return pieceCountInPile;

    if (hoveredPiece.pileId !== pileId) return `${pieceCountInPile} → ${pieceCountInPile + (hoveredPiece.pieceId+1)/2 }`;

    return `${pieceCountInPile} → ${pieceCountInPile - hoveredPiece.pieceId - 1}`;
  };

  return (
  <section className="p-2 shrink-0 grow basis-2/3">
    {[0, 1].map(pileId => (
      <div
        key={pileId}
        className={`
          w-[50%] pl-1 inline-block text-center
          ${pileId === 0 && board[0] >= board[1] ? 'border-r-2' : ''}
          ${pileId === 1 && board[0] < board[1] ? 'border-l-2' : ''}
        `}
        style={{ transform: 'scaleY(-1)' }}
      >
        <p className="text-xl" style={{ transform: 'scaleY(-1)' }}>
          {currentChoiceDescription(pileId)}
        </p>
          {range(20).map(pieceId => (
            <button
              key={pieceId}
              disabled={isDisabled({ pileId, pieceId })}
              className={`
                inline-block w-[20%] aspect-square rounded-full mx-0.5
                ${isDisabled({ pileId, pieceId }) && 'cursor-not-allowed'}
                ${toAppear({ pileId, pieceId }) && nonExistent({ pileId, pieceId }) ? 'bg-blue-900 opacity-30' : ''}
                ${toBeRemoved({ pileId, pieceId }) ? 'bg-red-600 opacity-50' : ''}
                ${(nonExistent({ pileId, pieceId }) && !toAppear({ pileId, pieceId })) ? 'bg-white' : ''}
                ${!nonExistent({ pileId, pieceId }) && !toBeRemoved({ pileId, pieceId }) ? 'bg-blue-900' : ''}
              `}
              onClick={() => clickPiece({ pileId, pieceId })}
              onFocus={() => hoverPiece({ pileId, pieceId })}
              onBlur={() => hoverPiece(null)}
              onMouseOver={() => hoverPiece({ pileId, pieceId }) }
              onMouseOut={() => hoverPiece(null)}
            ></button>
          ))}
      </div>
    ))}
  </section>
  );
};

const rule = <>
  A pályán mindig két kupac korong található. Egy lépésben az éppen soron következő játékos az egyik
  kupacból elvesz páros sok korongot (legalább kettőt), és a másik kupachoz hozzáad feleannyit.
  Az veszít, aki nem tud a szabályoknak megfelően lépni.
</>;

const Game = strategyGameFactory({
  rule,
  title: 'Kettőt vesz, egyet kap',
  GameBoard,
  G: {
    getPlayerStepDescription: () => 'Kattints egy korongra, hogy jelezd, hány korongot szeretnél elvenni a kupacból.',
    generateStartBoard,
    getGameStateAfterAiTurn: ({ board }) => getGameStateAfterMove(board, getOptimalAiMove(board))
  }
});

export const AddReduceDouble = () => {
  const [board, setBoard] = useState(generateStartBoard());

  return <Game board={board} setBoard={setBoard} />;
};
