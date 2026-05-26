import { useState } from 'react';
import { range, isEqual, random, cloneDeep } from 'lodash';
import { strategyGameFactory, type BoardClientProps, type Events, GameBoard } from '../../../game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';

export type Board = number[];
type Piece = { pileId: number; pieceId: number };
type HoveredPiece = Piece | null;

const generateStartBoard = (): Board => {
  const x = random(2, 8) * 2 + 1;
  const y = random(3, Math.min(20, 33 - x));
  return [x, y, 37 - x - y];
};

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const [removedPileId, setRemovedPileId] = useState<number | null>(null);
  const [hoveredPiece, setHoveredPiece] = useState<HoveredPiece>(null);
  const [hoveredPileId, setHoveredPileId] = useState<number | null>(null);

  const isDisabled = ({ pileId, pieceId }: Piece) => {
    if (!ctx.isClientMoveAllowed) return true;
    if (removedPileId === null) return false;
    return pileId !== removedPileId && pieceId === board[pileId] - 1;
  };

  const clickPiece = ({ pileId, pieceId }: Piece) => {
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

    const { nextBoard } = moves.removePile(board, removedPileId);

    setTimeout(() => {
      moves.splitPile(nextBoard, { pileId, pieceCount: pieceId + 1 });

      setRemovedPileId(null);
      setHoveredPiece(null);
    }, 750);
  };

  const toBeLeft = ({ pileId, pieceId }: Piece) => {
    if (hoveredPiece === null) return false;
    if (removedPileId === null) return false;
    if (removedPileId === pileId) return false;
    if (pileId !== hoveredPiece.pileId) return false;
    if (hoveredPiece.pieceId === board[pileId] - 1) return false;
    if (pieceId > hoveredPiece.pieceId) return false;
    return true;
  };

  const isHoverPreviewedForRemoval = ({ pileId }: { pileId: number }) => {
    if (!ctx.isClientMoveAllowed) return false;
    if (removedPileId !== null) return false;
    return hoveredPileId === pileId;
  };

  const clickPile = (pileId) => {
    if (!ctx.isClientMoveAllowed) return;
    if (removedPileId === pileId) { setRemovedPileId(null); return; }
    if (removedPileId === null) setRemovedPileId(pileId);
  };

  const pieceColor = ({ pileId, pieceId }: Piece) => {
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
  <GameBoard>
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
  </GameBoard>
  );
};

const moves = {
  removePile: (board: Board, _, pileId: number) => {
    const nextBoard = cloneDeep(board);
    nextBoard[pileId] = 0;
    return { nextBoard };
  },
  splitPile: (board: Board, { events }: { events: Events }, { pileId, pieceCount }) => {
    const nextBoard = cloneDeep(board);
    const removedPileId = [0, 1, 2].find(i => nextBoard[i] === 0)!;
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
  presentation: {
    rule,
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt 🤖', en: 'Test 🤖' } },
    { botStrategy: smartBotStrategy, generateStartBoard, label: { hu: 'Okos 🤖', en: 'Smart 🤖' }, isDefault: true }
  ]
});
