import React, { useState } from 'react';
import { range, isEqual, random, cloneDeep } from 'lodash';
import { strategyGameFactory } from '../../strategy-game';
import { aiBotStrategy } from './bot-strategy';
import { gameList } from '../../gameList';

const generateStartBoard = () => {
  const x = random(2, 8) * 2 + 1;
  const y = random(3, Math.min(20, 33 - x));
  return [x, y, 37 - x - y];
};

const BoardClient = ({ board, ctx, moves }) => {
  const [removedPileId, setRemovedPileId] = useState(null);
  const [hoveredPiece, setHoveredPiece] = useState(null);
  const [hoveredPileId, setHoveredPileId] = useState(null);

  const isDisabled = ({ pileId, pieceId }) => {
    if (!ctx.isClientMoveAllowed) return true;
    if (removedPileId === null) return false;
    return pileId !== removedPileId && pieceId === board[pileId] - 1;
  };

  const clickPiece = ({ pileId, pieceId }) => {
    if (!ctx.isClientMoveAllowed) return;

    if (removedPileId === pileId) {
      setRemovedPileId(null);
      return;
    }
    if (removedPileId === null) {
      setRemovedPileId(pileId);
      return;
    }
    if (pieceId === board[pileId] - 1) return;

    const { nextBoard } = moves.removePile(board, removedPileId)

    setTimeout(() => {
      moves.splitPile(nextBoard, { pileId, pieceCount: pieceId + 1 })

      setRemovedPileId(null);
      setHoveredPiece(null);
    }, 750);
  };

  const toBeLeft = ({ pileId, pieceId }) => {
    if (hoveredPiece === null) return false;
    if (removedPileId === null) return false;
    if (removedPileId === pileId) return false;
    if (pileId !== hoveredPiece.pileId) return false;
    if (hoveredPiece.pieceId === board[pileId] - 1) return false;
    if (pieceId > hoveredPiece.pieceId) return false;
    return true;
  };

  const isHoverPreviewedForRemoval = ({ pileId }) => {
    if (!ctx.isClientMoveAllowed) return false;
    if (removedPileId !== null) return false;
    return hoveredPileId === pileId;
  };

  const clickPile = (pileId) => {
    if (!ctx.isClientMoveAllowed) return;
    if (removedPileId === pileId) { setRemovedPileId(null); return; }
    if (removedPileId === null) setRemovedPileId(pileId);
  };

  const pieceColor = ({ pileId, pieceId }) => {
    if (pileId === removedPileId) return 'bg-slate-600 opacity-75';
    if (isHoverPreviewedForRemoval({ pileId })) return 'bg-slate-600 opacity-50';
    if (toBeLeft({ pileId, pieceId })) return 'bg-blue-900';
    return 'bg-blue-600';
  };

  const currentChoiceDescription = (pileId) => {
    const pieceCountInPile = board[pileId];

    // pieceCountInPile can be 0 in intermediateBoard during AI turn
    if (!ctx.isClientMoveAllowed) return pieceCountInPile || '🗑️';
    if (pileId === removedPileId) {
      // pieceCountInPile can be 0 in intermediateBoard
      return pieceCountInPile ? `${pieceCountInPile} → 🗑️` : '🗑️';
    }
    if (removedPileId === null) {
      return hoveredPileId === pileId ? `${pieceCountInPile} → 🗑️` : pieceCountInPile || '🗑️';
    }
    if (!hoveredPiece || hoveredPiece.pileId !== pileId) return pieceCountInPile || '🗑️';
    return `${pieceCountInPile} → ${hoveredPiece.pieceId + 1}, ${pieceCountInPile - hoveredPiece.pieceId - 1}`;
  };

  return (
  <section className="p-2 shrink-0 grow basis-2/3">
    {[0, 1, 2].map(pileId => (
      <div
        key={pileId}
        className={`
          w-[50%] pl-1 inline-block text-center py-2
          ${pileId < 2 ? 'border-t-2': ''}
          ${pileId === 0 && board[0] >= board[1] ? 'border-r-2' : ''}
          ${pileId === 1 && board[0] < board[1] ? 'border-l-2' : ''}
        `}
        style={{ transform: 'scaleY(-1)' }}
        onClick={() => clickPile(pileId)}
        onMouseEnter={() => setHoveredPileId(pileId)}
        onMouseLeave={() => setHoveredPileId(null)}
      >
        <p className="text-xl" style={{ transform: 'scaleY(-1)' }}>
          {currentChoiceDescription(pileId)}
        </p>
          {range(board[pileId]).map(pieceId => (
            <button
              key={pieceId}
              disabled={isDisabled({ pileId, pieceId })}
              className={`
                inline-block w-[20%] aspect-square rounded-full mx-0.5 mt-0.5
                disabled:cursor-not-allowed
                ${pieceColor({ pileId, pieceId })}
              `}
              onClick={(e) => { e.stopPropagation(); clickPiece({ pileId, pieceId }); }}
              onFocus={() => setHoveredPiece({ pileId, pieceId })}
              onBlur={() => setHoveredPiece(null)}
              onMouseOver={() => setHoveredPiece({ pileId, pieceId })}
              onMouseOut={() => setHoveredPiece(null)}
            ></button>
          ))}
      </div>
    ))}
  </section>
  );
};

const moves = {
  removePile: (board, _, pileId) => {
    const nextBoard = cloneDeep(board);
    nextBoard[pileId] = 0;
    return { nextBoard };
  },
  splitPile: (board, { events }, { pileId, pieceCount }) => {
    const nextBoard = cloneDeep(board);
    const removedPileId = [0, 1, 2].find(i => nextBoard[i] === 0)
    if (removedPileId === undefined) console.error('invalid_move');
    if (removedPileId < pileId) {
      nextBoard[removedPileId] = pieceCount;
      nextBoard[pileId] = nextBoard[pileId] - pieceCount;
    } else {
      nextBoard[removedPileId] = nextBoard[pileId] - pieceCount;
      nextBoard[pileId] = pieceCount;
    }
    events.endTurn();
    if (isEqual(nextBoard, [1, 1, 1])) {
      events.endGame();
    }
    return { nextBoard };
  }
};

const getPlayerStepDescription = () => ({
  hu: 'Először kattints az eltávolítandó kupacra, majd arra a korongra, ahol ketté akarod vágni a kupacot.',
  en: 'First click the pile to remove, then click the piece where you want to split another pile.'
});

const rule = {
  hu: <>
    A pályán kezdetben 37 korong van, három kupacban.
    A soron következő játékos először az egyik kupacot teljes egészében kiveszi a játékból;
    majd egy másik kupacot kettéoszt két kisebb kupacra (mindkettőbe legalább 1 korongnak kerülnie kell).
    Egy lépést követően tehát újra három kupac marad. Az veszít, aki nem tud lépni.
  </>,
  en: <>
    There are 37 pieces on the board at the start, in three piles. The current player first removes
    one pile entirely from the game, then splits another pile into two smaller piles (each must
    contain at least 1 piece). After each move there are again three piles. The player who cannot
    move loses.
  </>
};

export const PileSplitter3 = strategyGameFactory({
  rule,
  metadata: gameList.PileSplitter3,
  BoardClient,
  getPlayerStepDescription,
  generateStartBoard,
  moves,
  aiBotStrategy
});
