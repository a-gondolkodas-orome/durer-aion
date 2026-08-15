import type { MouseEvent } from 'react';
import { range } from 'lodash';
import { useTranslation } from 'language';
import {
  type BoardClientProps,
  GameBoard,
  useHoverPreview,
  useDeferredMove,
  useMoveScopedState
} from 'strategy-game-factory';
import { PileArea, PileCard, previewProps, previewsByHover, type DiscardState } from './pile-card';
import { isSplitAllowed, withPileRemoved, type Board, type Piece } from './gameplay';

// The three- and four-pile siblings are played identically: click the pile to
// discard, then the piece to cut the next one at. Only the number of piles
// differs, and the board carries it — so they share this client outright.
// `pile-splitter` does not: on two piles the pile to discard is implied, which
// makes its turn a single click.
export const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();
  const [removedPileId, setRemovedPileId] = useMoveScopedState<number | null>(ctx.moveCount, null);
  const { value: validHoveredPiece, ...preview } = useHoverPreview<Piece>(ctx.moveCount);
  const { value: validHoveredPileId, hoverProps: pileHoverProps } = useHoverPreview<number>(ctx.moveCount);
  const deferMove = useDeferredMove(ctx.moveCount);
  // said by the header button of the pile picked to discard and by its pieces
  // alike: both undo the pick
  const keepLabel = t({ hu: 'mégsem dobod el ezt a kupacot', en: 'keep this pile after all' });

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

    // Where nothing hovers, the first tap previews the split and the second
    // plays it; a mouse or a keyboard has previewed it already, so a single
    // click or keypress plays the turn as it always has.
    if (!previewsByHover() && previewedSplitAt(pileId) !== pieceId) {
      preview.set({ pileId, pieceId });
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

  const discardState = (pileId: number): DiscardState => {
    if (pileId === removedPileId) return 'chosen';
    if (isHoverPreviewedForRemoval(pileId)) return 'preview';
    return 'no';
  };

  const previewedSplitAt = (pileId: number): number | null => {
    if (validHoveredPiece === null) return null;
    if (removedPileId === null) return null;
    if (removedPileId === pileId) return null;
    if (pileId !== validHoveredPiece.pileId) return null;
    // Picking the pile to discard is not a move, so a piece hovered before that
    // click is still remembered after it — and it may be one this turn cannot
    // be cut at, the top piece above all.
    if (isDisabled(validHoveredPiece)) return null;
    return validHoveredPiece.pieceId;
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
    const splitAt = previewedSplitAt(pileId);
    if (splitAt === null) return pieceCountInPile;
    return `${pieceCountInPile} → ${splitAt + 1}, ${pieceCountInPile - splitAt - 1}`;
  };

  // A piece stands in for the pile as a whole until one has been picked to
  // discard, and for the pile it was picked from afterwards: either way the
  // click discards or un-discards the pile, and the piece under the pointer has
  // nothing to do with it. What it is called, whether it lights up under the
  // pointer and whether it is worth stopping at while tabbing all follow from
  // that.
  const standsForThePile = (pileId: number) =>
    removedPileId === null || pileId === removedPileId;

  const pieceLabel = ({ pileId, pieceId }: Piece) => {
    if (removedPileId === null) {
      return t({
        hu: `${board[pileId]} korongos kupac eldobása`,
        en: `discard the pile of ${board[pileId]}`
      });
    }
    if (pileId === removedPileId) return keepLabel;
    return t({ hu: `vágás a(z) ${pieceId + 1}. korong után`, en: `split after piece ${pieceId + 1}` });
  };

  const pieceProps = ({ pileId, pieceId }: Piece) => {
    const disabled = isDisabled({ pileId, pieceId });

    return {
      disabled,
      'aria-label': pieceLabel({ pileId, pieceId }),
      // where the header button says the same thing, the pieces stay out of the
      // tab order rather than repeating it once per piece
      tabIndex: standsForThePile(pileId) ? -1 : undefined,
      onClick: (e: MouseEvent) => { e.stopPropagation(); clickPiece({ pileId, pieceId }); },
      ...(disabled ? {} : previewProps({ pileId, pieceId }, preview))
    };
  };

  // The discard is a click on the pile as a whole, which the pieces stand in for
  // — but only this button says so, and only it can be reached from a keyboard.
  const discardButton = (pileId: number) => {
    const isChosen = pileId === removedPileId;
    if (!ctx.isClientMoveAllowed) return null;
    if (!isChosen && !canSelectPile(pileId)) return null;

    return (
      <button
        type="button"
        aria-label={isChosen ? keepLabel : t({ hu: 'kupac eldobása', en: 'discard this pile' })}
        className="text-sm leading-none rounded p-1 hocus:bg-slate-200 dark:hocus:bg-slate-700"
        onClick={e => { e.stopPropagation(); clickPile(pileId); }}
        {...(canSelectPile(pileId) ? pileHoverProps(pileId) : {})}
      >
        {isChosen ? '↩️' : '🗑️'}
      </button>
    );
  };

  return (
    <GameBoard>
      <PileArea pileCount={board.length}>
        {range(board.length).map(pileId => (
          <PileCard
            key={pileId}
            size={board[pileId]}
            caption={currentChoiceDescription(pileId)}
            discard={discardState(pileId)}
            splitAfter={previewedSplitAt(pileId)}
            headerAction={discardButton(pileId)}
            piecesStandForThePile={standsForThePile(pileId)}
            pieceProps={pieceId => pieceProps({ pileId, pieceId })}
            cardProps={{
              onClick: () => clickPile(pileId),
              ...(canSelectPile(pileId) ? pileHoverProps(pileId) : {})
            }}
          />
        ))}
      </PileArea>
    </GameBoard>
  );
};
