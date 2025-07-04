import React, { useState } from 'react';
import { range, isEqual, random, cloneDeep } from 'lodash';
import { strategyGameFactory } from '../../strategy-game';
import { aiBotStrategy } from './bot-strategy';

const BoardClient = ({ board, ctx, moves }) => {
  const [hoveredPiece, setHoveredPiece] = useState(null);

  const nonExistent = ({ pileId, pieceId }) => {
    return pieceId >= board[pileId];
  };

  const isDisabled = ({ pileId, pieceId }) => {
    if (!ctx.shouldRoleSelectorMoveNext) return true;
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

    moves.moveHalvedPieces(board, { pileId, pieceCount: pieceId + 1 });
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

    if (!ctx.shouldRoleSelectorMoveNext) return pieceCountInPile;
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
                inline-block w-[20%] aspect-square rounded-full mx-0.5 mt-0.5
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

const moves = {
  moveHalvedPieces: (board, { events }, { pileId, pieceCount }) => {
    if (pieceCount % 2 !== 0) console.error('invalid_move');
    const nextBoard = cloneDeep(board);
    nextBoard[pileId] -= pieceCount;
    nextBoard[1 - pileId] += pieceCount / 2;
    events.endTurn();
    const isGameEnd = isEqual(nextBoard, [1, 1]) || isEqual(nextBoard, [0, 1]) || isEqual(nextBoard, [1, 0]);
    if (isGameEnd) {
      events.endGame();
    }
    return { nextBoard };
  }
}

const rule = <>
  A pályán mindig két kupac korong található. Egy lépésben az éppen soron következő játékos az egyik
  kupacból elvesz páros sok korongot (legalább kettőt), és a másik kupachoz hozzáad feleannyit.
  Az veszít, aki nem tud lépni.
</>;

export const AddReduceDouble = strategyGameFactory({
  rule,
  title: 'Kettőt vesz, egyet kap',
  BoardClient,
  getPlayerStepDescription: () => 'Kattints egy korongra, hogy jelezd, hány korongot szeretnél elvenni a kupacból.',
  generateStartBoard: () => ([random(3, 10), random(3, 10)]),
  moves,
  aiBotStrategy
});
