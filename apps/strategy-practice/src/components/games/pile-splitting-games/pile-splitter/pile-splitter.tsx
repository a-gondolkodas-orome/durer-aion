import { random } from 'lodash';
import { useTranslation } from 'language';
import {
  strategyGameFactory,
  type BoardClientProps,
  GameBoard,
  useHoverPreview,
  useDeferredMove
} from 'strategy-game-factory';
import { PileArea, PileCard, previewProps, previewsByHover, type DiscardState } from '../pile-card';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { isSplitAllowed, moves, withPileRemoved, type Board, type Piece } from './gameplay';

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();
  const { value: validHoveredPiece, ...preview } = useHoverPreview<Piece>(ctx.moveCount);
  const deferMove = useDeferredMove(ctx.moveCount);

  // One click performs the whole turn, so a piece is clickable only if both
  // halves are legal: discarding the other pile, then splitting this one here.
  const isDisabled = ({ pileId, pieceId }: Piece) =>
    !moves.removePile.isAllowed(board, 1 - pileId)
      || !isSplitAllowed(withPileRemoved(board, 1 - pileId), pileId, pieceId + 1);

  const clickPiece = ({ pileId, pieceId }: Piece) => {
    // Where nothing hovers, the first tap previews the split and the second
    // plays it; a mouse or a keyboard has previewed it already, so a single
    // click or keypress plays the turn as it always has.
    if (!previewsByHover() && previewedSplitAt(pileId) !== pieceId) {
      preview.set({ pileId, pieceId });
      return;
    }

    const { nextBoard } = moves.removePile(board, 1 - pileId);

    deferMove(() => moves.splitPile(nextBoard, { pileId, pieceCount: pieceId + 1 }));
  };

  // The previewed pile is the one being split; the other is the one the same
  // click discards.
  const previewedSplitAt = (pileId: number): number | null => {
    if (!ctx.isClientMoveAllowed || validHoveredPiece === null) return null;
    return validHoveredPiece.pileId === pileId ? validHoveredPiece.pieceId : null;
  };

  const discardState = (pileId: number): DiscardState => {
    if (!ctx.isClientMoveAllowed || validHoveredPiece === null) return 'no';
    return validHoveredPiece.pileId === pileId ? 'no' : 'preview';
  };

  const currentChoiceDescription = (pileId: number) => {
    const pieceCountInPile = board[pileId];

    // A pile is 0 for the beat between `removePile` and `splitPile` — the
    // mover's own turn as much as the bot's, since the removal does not end the
    // turn — and it reads as discarded whatever is hovered meanwhile.
    if (pieceCountInPile === 0) return '🗑️';
    const splitAt = previewedSplitAt(pileId);
    if (splitAt === null) {
      return discardState(pileId) === 'no' ? pieceCountInPile : `${pieceCountInPile} → 🗑️`;
    }
    return `${pieceCountInPile} → ${splitAt + 1}, ${pieceCountInPile - splitAt - 1}`;
  };

  const pieceProps = ({ pileId, pieceId }: Piece) => {
    const disabled = isDisabled({ pileId, pieceId });

    return {
      disabled,
      'aria-label': t({
        hu: `vágás a(z) ${pieceId + 1}. korong után`,
        en: `split after piece ${pieceId + 1}`
      }),
      onClick: () => clickPiece({ pileId, pieceId }),
      ...(disabled ? {} : previewProps({ pileId, pieceId }, preview))
    };
  };

  return (
    <GameBoard>
      <PileArea pileCount={2}>
        {[0, 1].map(pileId => (
          <PileCard
            key={pileId}
            size={board[pileId]}
            caption={currentChoiceDescription(pileId)}
            discard={discardState(pileId)}
            splitAfter={previewedSplitAt(pileId)}
            pieceProps={pieceId => pieceProps({ pileId, pieceId })}
          />
        ))}
      </PileArea>
    </GameBoard>
  );
};

const getPlayerStepDescription = () => ({
  hu: 'Kattints a korongra, ahol ketté akarod vágni a kupacot.',
  en: 'Click the piece where you want to split the pile.'
});

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

export const PileSplitter = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      label: { hu: 'Teszt', en: 'Test' },
      generateStartBoard: () => ([random(2, 5), random(2, 5)])
    },
    {
      botStrategy: smartBotStrategy,
      generateStartBoard: () => ([random(3, 10), random(3, 10)]),
      label: { hu: 'Teljes', en: 'Full' },
      isDefault: true
    }
  ]
});
