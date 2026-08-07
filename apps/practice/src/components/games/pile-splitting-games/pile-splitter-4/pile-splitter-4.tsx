import { useState } from 'react';
import { range } from 'lodash';
import {
  strategyGameFactory,
  type BoardClientProps,
  GameBoard,
  useHoverPreview,
  useDeferredMove
} from 'strategy-game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { isSplitAllowed, withPileRemoved } from '../gameplay';
import { generateStartBoard, generateTestStartBoard, moves, type Board, type Piece } from './gameplay';

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const [removedPileId, setRemovedPileId] = useState<number | null>(null);
  const { value: validHoveredPiece, hoverProps } = useHoverPreview<Piece>(ctx.moveCount);
  const deferMove = useDeferredMove(ctx.moveCount);
  const { value: validHoveredPileId, hoverProps: pileHoverProps } = useHoverPreview<number>(ctx.moveCount);

  const canSelectPile = (pileId: number) =>
    removedPileId === null && moves.removePile.isAllowed(board, pileId);

  const isDisabled = ({ pileId, pieceId }: Piece) => {
    if (!ctx.isClientMoveAllowed) return true;
    // the first click picks the pile to discard, the second where to split
    if (removedPileId === null) return !canSelectPile(pileId);
    // clicking the picked pile again deselects it
    if (pileId === removedPileId) return false;
    return !isSplitAllowed(withPileRemoved(board, removedPileId), pileId, pieceId + 1);
  };

  // The click handlers keep their guards: a rejected click must leave the local
  // pile selection alone, which the engine's silent gating cannot do for us.
  const clickPiece = ({ pileId, pieceId }: Piece) => {
    if (isDisabled({ pileId, pieceId })) return;

    if (removedPileId === pileId) {
      setRemovedPileId(null);
      return;
    }
    if (removedPileId === null) {
      setRemovedPileId(pileId);
      return;
    }

    const { nextBoard } = moves.removePile(board, removedPileId);

    deferMove(() => {
      moves.splitPile(nextBoard, { pileId, pieceCount: pieceId + 1 });
      setRemovedPileId(null);
    });
  };

  const leftBorder = (pileId) => {
    return (
      (pileId === 1 && board[1] > board[0]) ||
      (pileId === 3 && board[3] > board[2])
    );
  };

  const rightBorder = (pileId) => {
    return (
      (pileId === 0 && board[1] <= board[0]) ||
      (pileId === 2 && board[3] <= board[2])
    );
  };

  const isHoverPreviewedForRemoval = (pileId: number) =>
    canSelectPile(pileId) && validHoveredPileId === pileId;

  const clickPile = (pileId: number) => {
    if (!ctx.isClientMoveAllowed) return;
    if (removedPileId === pileId) { setRemovedPileId(null); return; }
    if (canSelectPile(pileId)) setRemovedPileId(pileId);
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

  const pieceColor = ({ pileId, pieceId }: Piece) => {
    if (pileId === removedPileId) return 'bg-slate-900/40 dark:bg-white/20';
    if (isHoverPreviewedForRemoval(pileId)) return 'bg-slate-900/20 dark:bg-white/10';
    if (toBeLeft({ pileId, pieceId })) return 'bg-blue-800/75';
    return 'bg-blue-800';
  };

  const currentChoiceDescription = (pileId) => {
    const pieceCountInPile = board[pileId];

    // A pile is 0 between the bot's `removePile` and its `splitPile`.
    if (!ctx.isClientMoveAllowed) return pieceCountInPile || '🗑️';
    if (pileId === removedPileId) {
      // and likewise between the player's own two moves
      return pieceCountInPile ? `${pieceCountInPile} → 🗑️` : '🗑️';
    }
    if (removedPileId === null) {
      return isHoverPreviewedForRemoval(pileId) ? `${pieceCountInPile} → 🗑️` : pieceCountInPile || '🗑️';
    }
    if (!validHoveredPiece || validHoveredPiece.pileId !== pileId) return pieceCountInPile || '🗑️';
    return `
      ${pieceCountInPile} → ${validHoveredPiece.pieceId + 1}, ${pieceCountInPile - validHoveredPiece.pieceId - 1}
    `;
  };

  return (
  <GameBoard>
    {[0, 1, 2, 3].map(pileId => (
      <div
        key={pileId}
        className={`
          w-[50%] pl-1 inline-block text-center py-2
          ${pileId < 2 ? 'border-t-2': ''}
          ${rightBorder(pileId) ? 'border-r-2' : ''}
          ${leftBorder(pileId) ? 'border-l-2' : ''}
        `}
        style={{ transform: 'scaleY(-1)' }}
        onClick={() => clickPile(pileId)}
        {...(canSelectPile(pileId) ? pileHoverProps(pileId) : {})}
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
              {...(isDisabled({ pileId, pieceId }) ? {} : hoverProps({ pileId, pieceId }))}
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

const getPlayerStepDescription = () => ({
  hu: 'Először kattints az eltávolítandó kupacra, majd arra a korongra, ahol ketté akarod vágni a kupacot.',
  en: 'First click the pile you wish to remove, then the disk where you want to split.'
});

const rule = {
  hu: <>
    A pályán kezdetben négy kupac korong van.
    A soron következő játékos először az egyik kupacot teljes egészében kiveszi a játékból;
    majd egy másik kupacot kettéoszt két kisebb kupacra (mindkettőbe legalább 1 korongnak kerülnie kell).
    Egy lépést követően tehát újra 4 kupac marad. Az veszít, aki nem tud lépni.
  </>,
  en: <>
    At the beginning of the game there are 4 piles of disks on the table.
    The player who is in turn takes away a pile, then divides one of the remaining piles into
    two nonempty piles. Whoever is unable to move, loses.
  </>
};

export const PileSplitter4 = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      generateStartBoard: generateTestStartBoard,
      label: { hu: 'Teszt', en: 'Test' }
    },
    { botStrategy: smartBotStrategy, generateStartBoard, label: { hu: 'Teljes', en: 'Full' }, isDefault: true }
  ]
});
