import { range, random } from 'lodash';
import {
  strategyGameFactory,
  type BoardClientProps,
  GameBoard,
  useHoverPreview,
  useDeferredMove
} from 'strategy-game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { isSplitAllowed, moves, withPileRemoved, type Board, type Piece } from './gameplay';

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { value: validHoveredPiece, hoverProps } = useHoverPreview<Piece>(ctx.moveCount);
  const deferMove = useDeferredMove(ctx.moveCount);

  // One click performs the whole turn, so a piece is clickable only if both
  // halves are legal: discarding the other pile, then splitting this one here.
  const isDisabled = ({ pileId, pieceId }: Piece) =>
    !moves.removePile.isAllowed(board, 1 - pileId)
      || !isSplitAllowed(withPileRemoved(board, 1 - pileId), pileId, pieceId + 1);

  const clickPiece = ({ pileId, pieceId }: Piece) => {
    const { nextBoard } = moves.removePile(board, 1 - pileId);

    deferMove(() => moves.splitPile(nextBoard, { pileId, pieceCount: pieceId + 1 }));
  };

  const toBeLeft = ({ pileId, pieceId }: Piece) => {
    if (!ctx.isClientMoveAllowed) return false;
    if (validHoveredPiece === null) return false;
    if (pileId !== validHoveredPiece.pileId) return false;
    return pieceId <= validHoveredPiece.pieceId;
  };

  const toBeRemoved = (pileId: number) => {
    if (!ctx.isClientMoveAllowed) return false;
    if (validHoveredPiece === null) return false;
    return validHoveredPiece.pileId !== pileId;
  };

  // One class, not a base colour with overrides stacked after it: which of two
  // `bg-` utilities wins is decided by the order Tailwind emits them, not by
  // the order they are written here.
  const pieceColor = ({ pileId, pieceId }: Piece) => {
    if (toBeRemoved(pileId)) return 'bg-slate-900/40 dark:bg-white/20';
    if (toBeLeft({ pileId, pieceId })) return 'bg-blue-800/75';
    return 'bg-blue-800';
  };

  const currentChoiceDescription = (pileId: number) => {
    const pieceCountInPile = board[pileId];

    // A pile is 0 for the beat between `removePile` and `splitPile` — the
    // mover's own turn as much as the bot's, since the removal does not end the
    // turn — and it reads as discarded whatever is hovered meanwhile.
    if (pieceCountInPile === 0) return '🗑️';
    if (!ctx.isClientMoveAllowed || !validHoveredPiece) return pieceCountInPile;
    if (validHoveredPiece.pileId !== pileId) return `${pieceCountInPile} → 🗑️`;

    const split = validHoveredPiece.pieceId + 1;
    return `${pieceCountInPile} → ${split}, ${pieceCountInPile - split}`;
  };

  return (
  <GameBoard>
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
                onClick={() => clickPiece({ pileId, pieceId })}
                {...(disabled ? {} : hoverProps({ pileId, pieceId }))}
              >
                {!disabled &&
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
