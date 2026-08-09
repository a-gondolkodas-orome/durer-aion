import { range } from 'lodash';
import {
  type BoardClientProps,
  GameBoard,
  useHoverPreview,
  useDeferredMove,
  useMoveScopedState
} from 'strategy-game-factory';
import { isSplitAllowed, withPileRemoved, type Board, type Piece } from './gameplay';

// The three- and four-pile siblings are played identically: click the pile to
// discard, then the piece to cut the next one at. Only the number of piles
// differs, and the board carries it — so they share this client outright.
// `pile-splitter` does not: on two piles the pile to discard is implied, which
// makes its turn a single click.
export const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const [removedPileId, setRemovedPileId] = useMoveScopedState<number | null>(ctx.moveCount, null);
  const { value: validHoveredPiece, hoverProps } = useHoverPreview<Piece>(ctx.moveCount);
  const { value: validHoveredPileId, hoverProps: pileHoverProps } = useHoverPreview<number>(ctx.moveCount);
  const deferMove = useDeferredMove(ctx.moveCount);

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

    deferMove(() => moves.splitPile(nextBoard, { pileId, pieceCount: pieceId + 1 }));
  };

  const clickPile = (pileId: number) => {
    if (!ctx.isClientMoveAllowed) return;
    if (removedPileId === pileId) { setRemovedPileId(null); return; }
    if (canSelectPile(pileId)) setRemovedPileId(pileId);
  };

  const isHoverPreviewedForRemoval = (pileId: number) =>
    canSelectPile(pileId) && validHoveredPileId === pileId;

  const toBeLeft = ({ pileId, pieceId }: Piece) => {
    if (validHoveredPiece === null) return false;
    if (removedPileId === null) return false;
    if (removedPileId === pileId) return false;
    if (pileId !== validHoveredPiece.pileId) return false;
    // Picking the pile to discard is not a move, so a piece hovered before that
    // click is still remembered after it — and it may be one this turn cannot
    // be cut at, the top piece above all.
    if (isDisabled(validHoveredPiece)) return false;
    return pieceId <= validHoveredPiece.pieceId;
  };

  const pieceColor = ({ pileId, pieceId }: Piece) => {
    if (pileId === removedPileId) return 'bg-slate-900/40 dark:bg-white/20';
    if (isHoverPreviewedForRemoval(pileId)) return 'bg-slate-900/20 dark:bg-white/10';
    if (toBeLeft({ pileId, pieceId })) return 'bg-blue-800/75';
    return 'bg-blue-800';
  };

  const currentChoiceDescription = (pileId: number) => {
    const pieceCountInPile = board[pileId];

    // A pile is 0 for the beat between `removePile` and `splitPile` — the
    // mover's own turn as much as the bot's, since the removal does not end the
    // turn — and it reads as discarded whatever is selected or hovered meanwhile.
    if (pieceCountInPile === 0) return '🗑️';
    if (!ctx.isClientMoveAllowed) return pieceCountInPile;
    // the pile picked to discard, before the click that dispatches the removal
    if (pileId === removedPileId) return `${pieceCountInPile} → 🗑️`;
    if (removedPileId === null) {
      return isHoverPreviewedForRemoval(pileId) ? `${pieceCountInPile} → 🗑️` : pieceCountInPile;
    }
    if (!validHoveredPiece || validHoveredPiece.pileId !== pileId) return pieceCountInPile;
    return `
      ${pieceCountInPile} → ${validHoveredPiece.pieceId + 1}, ${pieceCountInPile - validHoveredPiece.pieceId - 1}
    `;
  };

  // The piles sit two to a row; the divider between a pair hangs off whichever
  // of the two is taller. An odd last pile has no partner to be divided from,
  // and comparing against its missing neighbour is false, as it should be.
  const hasRightBorder = (pileId: number) => pileId % 2 === 0 && board[pileId] >= board[pileId + 1];
  const hasLeftBorder = (pileId: number) => pileId % 2 === 1 && board[pileId] > board[pileId - 1];

  return (
  <GameBoard>
    {range(board.length).map(pileId => (
      <div
        key={pileId}
        className={`
          w-[50%] pl-1 inline-block text-center py-2
          ${pileId < 2 ? 'border-t-2': ''}
          ${hasRightBorder(pileId) ? 'border-r-2' : ''}
          ${hasLeftBorder(pileId) ? 'border-l-2' : ''}
        `}
        style={{ transform: 'scaleY(-1)' }}
        onClick={() => clickPile(pileId)}
        {...(canSelectPile(pileId) ? pileHoverProps(pileId) : {})}
      >
        <p className="text-xl" style={{ transform: 'scaleY(-1)' }}>
          {currentChoiceDescription(pileId)}
        </p>
          {range(board[pileId]).map(pieceId => {
            const disabled = isDisabled({ pileId, pieceId });

            return (
              <button
                key={pieceId}
                disabled={disabled}
                className={`
                  w-[20%] aspect-square rounded-full mx-0.5 mt-0.5 align-top
                  ${pieceColor({ pileId, pieceId })}
                `}
                onClick={(e) => { e.stopPropagation(); clickPiece({ pileId, pieceId }); }}
                {...(disabled ? {} : hoverProps({ pileId, pieceId }))}
              >
                {!disabled && removedPileId !== null && removedPileId !== pileId &&
                <p className="text-sm" style={{ transform: 'scaleY(-1)' }}>
                  {pieceId + 1};{board[pileId] - pieceId - 1}
                </p>}
              </button>
            );
          })}
      </div>
    ))}
  </GameBoard>
  );
};
