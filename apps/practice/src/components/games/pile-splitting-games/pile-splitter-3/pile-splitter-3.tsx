import { useState } from 'react';
import { range, isEqual, random, cloneDeep } from 'lodash';
import {
  strategyGameFactory, type BoardClientProps, type Ctx, type MoveOutcome, GameBoard, useHoverPreview
} from '../../../strategy-game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { emptiedPileId, isRemovalAllowed, isSplitAllowed, withPileRemoved } from '../helpers';

export type Board = number[];
type Piece = { pileId: number; pieceId: number };

const generateStartBoard = (): Board => {
  const x = random(2, 8) * 2 + 1;
  const y = random(3, Math.min(20, 33 - x));
  return [x, y, 37 - x - y];
};

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const [removedPileId, setRemovedPileId] = useState<number | null>(null);
  const { value: validHoveredPiece, hoverProps } = useHoverPreview<Piece>(ctx.moveCount);
  const { value: validHoveredPileId, hoverProps: pileHoverProps } = useHoverPreview<number>(ctx.moveCount);

  const canSelectPile = (pileId: number) =>
    removedPileId === null && moves.removePile.isAllowed!(board, pileId);

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

    setTimeout(() => {
      moves.splitPile(nextBoard, { pileId, pieceCount: pieceId + 1 });

      setRemovedPileId(null);
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

  const isHoverPreviewedForRemoval = (pileId: number) =>
    canSelectPile(pileId) && validHoveredPileId === pileId;

  const clickPile = (pileId: number) => {
    if (!ctx.isClientMoveAllowed) return;
    if (removedPileId === pileId) { setRemovedPileId(null); return; }
    if (canSelectPile(pileId)) setRemovedPileId(pileId);
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
      return isHoverPreviewedForRemoval(pileId) ? `${pieceCountInPile} → 🗑️` : pieceCountInPile || '🗑️';
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

const moves = {
  removePile: {
    validate: (board: Board, _, pileId: number) => isRemovalAllowed(board, pileId),
    // First half of the turn: empty a pile, then split another into it — the
    // turn stays open in between.
    apply: (board: Board, _, pileId: number): MoveOutcome<Board> =>
      ({ nextBoard: withPileRemoved(board, pileId) })
  },
  splitPile: {
    validate: (board: Board, _, { pileId, pieceCount }: { pileId: number; pieceCount: number }) =>
      isSplitAllowed(board, pileId, pieceCount),
    apply: (board: Board, { ctx }: { ctx: Ctx }, { pileId, pieceCount }): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      // the slot emptied earlier this turn takes the other half of the split
      const removedPileId = emptiedPileId(nextBoard)!;
      if (removedPileId < pileId) {
        nextBoard[removedPileId] = pieceCount;
        nextBoard[pileId] = nextBoard[pileId] - pieceCount;
      } else {
        nextBoard[removedPileId] = nextBoard[pileId] - pieceCount;
        nextBoard[pileId] = pieceCount;
      }
      // All piles down to a single piece: the opponent cannot split anything.
      if (isEqual(nextBoard, [1, 1, 1])) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
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
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt', en: 'Test' } },
    // smart bot: verified as optimal
    { botStrategy: smartBotStrategy, generateStartBoard, label: { hu: 'Teljes', en: 'Full' }, isDefault: true }
  ]
});
