import { useState } from 'react';
import { range, isEqual, random, cloneDeep } from 'lodash';
import { strategyGameFactory, type BoardClientProps, type Events, GameBoard } from '../../../game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';

export type Board = number[];
type Piece = { pileId: number; pieceId: number };
type HoveredPiece = (Piece & { moveCount: number }) | null;

const generateStartBoard = (): Board => {
  const x = random(2, 8) * 2 + 1;
  const y = random(3, Math.min(20, 33 - x));
  return [x, y, 37 - x - y];
};

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const [removedPileId, setRemovedPileId] = useState<number | null>(null);
  const [hoveredPiece, setHoveredPiece] = useState<HoveredPiece>(null);
  const validHoveredPiece = (
    hoveredPiece?.moveCount === ctx.moveCount
    && hoveredPiece?.pieceId < board[hoveredPiece?.pileId] - 1
  ) ? hoveredPiece : null;
  const [hoveredPileId, setHoveredPileId] = useState<{ pileId: number; moveCount: number } | null>(null);
  const validHoveredPileId = hoveredPileId?.moveCount === ctx.moveCount ? hoveredPileId.pileId : null;

  const canRemovePile = (pileId: number) =>
    board.some((size, i) => i !== pileId && size >= 2);

  const isDisabled = ({ pileId, pieceId }: Piece) => {
    if (!ctx.isClientMoveAllowed) return true;
    if (removedPileId === null) return !canRemovePile(pileId);
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
    if (validHoveredPiece === null) return false;
    if (removedPileId === null) return false;
    if (removedPileId === pileId) return false;
    if (pileId !== validHoveredPiece.pileId) return false;
    if (validHoveredPiece.pieceId === board[pileId] - 1) return false;
    if (pieceId > validHoveredPiece.pieceId) return false;
    return true;
  };

  const isHoverPreviewedForRemoval = (pileId: number) => {
    if (!ctx.isClientMoveAllowed) return false;
    if (removedPileId !== null) return false;
    if (!canRemovePile(pileId)) return false;
    return validHoveredPileId === pileId;
  };

  const clickPile = (pileId) => {
    if (!ctx.isClientMoveAllowed) return;
    if (removedPileId === pileId) { setRemovedPileId(null); return; }
    if (removedPileId === null) {
      if (!canRemovePile(pileId)) return;
      setRemovedPileId(pileId);
    }
  };

  const pieceColor = ({ pileId, pieceId }: Piece) => {
    if (pileId === removedPileId) return 'bg-slate-900/40 dark:bg-white/20';
    if (isHoverPreviewedForRemoval(pileId)) return 'bg-slate-900/20 dark:bg-white/10';
    if (toBeLeft({ pileId, pieceId })) return 'bg-blue-800/75';
    return 'bg-blue-800';
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
      const showRemovePreview = validHoveredPileId === pileId && canRemovePile(pileId);
      return showRemovePreview ? `${pieceCountInPile} → 🗑️` : pieceCountInPile || '🗑️';
    }
    if (!validHoveredPiece || validHoveredPiece.pileId !== pileId) return pieceCountInPile || '🗑️';
    return `
      ${pieceCountInPile} → ${validHoveredPiece.pieceId + 1}, ${pieceCountInPile - validHoveredPiece.pieceId - 1}
    `;
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
        onPointerEnter={() => setHoveredPileId({ pileId, moveCount: ctx.moveCount })}
        onPointerMove={() => setHoveredPileId({ pileId, moveCount: ctx.moveCount })}
        onPointerLeave={() => setHoveredPileId(null)}
      >
        <p className="text-xl" style={{ transform: 'scaleY(-1)' }}>
          {currentChoiceDescription(pileId)}
        </p>
          {range(board[pileId]).map(pieceId => (
            <button
              key={pieceId}
              disabled={isDisabled({ pileId, pieceId })}
              className={`
                w-[20%] aspect-square rounded-full mx-0.5 mt-0.5 align-top
                ${pieceColor({ pileId, pieceId })}
              `}
              onClick={(e) => { e.stopPropagation(); clickPiece({ pileId, pieceId }); }}
              onFocus={() => setHoveredPiece({ pileId, pieceId, moveCount: ctx.moveCount })}
              onBlur={() => setHoveredPiece(null)}
              onPointerEnter={() => setHoveredPiece({ pileId, pieceId, moveCount: ctx.moveCount })}
              onPointerMove={() => setHoveredPiece({ pileId, pieceId, moveCount: ctx.moveCount })}
              onPointerLeave={() => setHoveredPiece(null)}
            >
              {!isDisabled({ pileId, pieceId }) && removedPileId !== null && removedPileId !== pileId &&
              <p className="text-sm" style={{ transform: 'scaleY(-1)' }}>
                {pieceId + 1};{board[pileId] - pieceId - 1}
              </p>}
            </button>
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
    // smart bot: verified as optimal
    { botStrategy: smartBotStrategy, generateStartBoard, label: { hu: 'Okos 🤖', en: 'Smart 🤖' }, isDefault: true }
  ]
});
