import React, { useState } from 'react';
import { range, isEqual, random, _, cloneDeep } from 'lodash';
import { strategyGameFactory } from '../../../game-factory/strategy-game';
import { aiBotStrategy } from './bot-strategy';
import { gameList } from '../../gameList';

const BoardClient = ({ board, ctx, moves }) => {
  const [hoveredPiece, setHoveredPiece] = useState(null);

  const isDisabled = ({ pileId, pieceId }) => {
    if (!ctx.isClientMoveAllowed) return true;
    return pieceId === board[pileId] - 1;
  };

  const clickPiece = ({ pileId, pieceId }) => {
    if (isDisabled({ pileId, pieceId })) return;

    const { nextBoard } = moves.removePile(board, 1 - pileId);

    setTimeout(() => {
      moves.splitPile(nextBoard, { pileId, pieceCount: pieceId + 1 });
      setHoveredPiece(null);
    }, 750);
  };

  const toBeLeft = ({ pileId, pieceId }) => {
    if (!ctx.isClientMoveAllowed) return false;
    if (hoveredPiece === null) return false;
    if (pileId !== hoveredPiece.pileId) return false;
    if (hoveredPiece.pieceId === board[pileId] - 1) return false;
    if (pieceId > hoveredPiece.pieceId) return false;
    return true;
  };

  const toBeRemoved = ({ pileId }) => {
    if (!ctx.isClientMoveAllowed) return false;
    if (hoveredPiece === null) return false;
    return hoveredPiece.pileId !== pileId;
  };

  const currentChoiceDescription = (pileId) => {
    const pieceCountInPile = board[pileId];

    if (!ctx.isClientMoveAllowed) return pieceCountInPile;
    if (!hoveredPiece) return pieceCountInPile;
    if (hoveredPiece.pileId !== pileId) return `${pieceCountInPile} → 🗑️`;

    return `${pieceCountInPile} → ${hoveredPiece.pieceId + 1}, ${pieceCountInPile - hoveredPiece.pieceId - 1}`;
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
          {range(board[pileId]).map(pieceId => (
            <button
              key={pieceId}
              disabled={isDisabled({ pileId, pieceId })}
              className={`
                inline-block bg-blue-600 w-[20%] aspect-square rounded-full mx-0.5 mt-0.5
                ${toBeRemoved({ pileId }) ? 'opacity-50 bg-slate-600' : ''}
                ${toBeLeft({ pileId, pieceId }) ? 'bg-blue-900' : ''}
              `}
              onClick={() => clickPiece({ pileId, pieceId })}
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

const getPlayerStepDescription = () => ({
  hu: 'Kattints a korongra, ahol ketté akarod vágni a kupacot.',
  en: 'Click the piece where you want to split the pile.'
});

const moves = {
  removePile: (board, _, pileId) => {
    const nextBoard = cloneDeep(board);
    nextBoard[pileId] = 0;
    return { nextBoard };
  },
  splitPile: (board, { events }, { pileId, pieceCount }) => {
    const nextBoard = [pieceCount, board[pileId] - pieceCount];
    events.endTurn();
    if (isEqual(nextBoard, [1, 1])) {
      events.endGame();
    }
    return { nextBoard };
  }
}

const rule = {
  hu: <>
    A pályán mindig két kupac korong található.
    A soron következő játékos választ egy kupacot, és azt szétosztja két kisebb kupacra (mindkettőbe
    legalább 1 korongnak kerülnie kell), a másik kupacot pedig kidobjuk.
    Az veszít, aki nem tud lépni.
  </>,
  en: <>
    There are always two piles of pieces on the board. The current player chooses one pile and
    splits it into two smaller piles (each must contain at least 1 piece); the other pile is
    discarded. The player who cannot move loses.
  </>
};

const { name, title, credit } = gameList.PileSplitter;
export const PileSplitter = strategyGameFactory({
  presentation: {
    rule,
    title: title || name,
    credit,
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  variants: [{ botStrategy: aiBotStrategy, generateStartBoard: () => ([random(3, 10), random(3, 10)]) }]
});
