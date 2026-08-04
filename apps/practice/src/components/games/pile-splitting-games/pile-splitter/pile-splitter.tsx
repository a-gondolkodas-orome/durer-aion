import { range, isEqual, random } from 'lodash';
import {
  strategyGameFactory, type BoardClientProps, type Ctx, type MoveOutcome, GameBoard, useHoverPreview
} from '../../../strategy-game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { isRemovalAllowed, isSplitAllowed, withPileRemoved } from '../helpers';

export type Board = number[];
type Piece = { pileId: number; pieceId: number };

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { value: validHoveredPiece, hoverProps } = useHoverPreview<Piece>(ctx.moveCount);

  // One click performs the whole turn, so a piece is clickable only if both
  // halves are legal: discarding the other pile, then splitting this one here.
  const isDisabled = ({ pileId, pieceId }: Piece) =>
    !moves.removePile.isAllowed(board, 1 - pileId)
      || !isSplitAllowed(withPileRemoved(board, 1 - pileId), pileId, pieceId + 1);

  const clickPiece = ({ pileId, pieceId }: Piece) => {
    const { nextBoard } = moves.removePile(board, 1 - pileId);

    setTimeout(() => {
      moves.splitPile(nextBoard, { pileId, pieceCount: pieceId + 1 });
    }, 750);
  };

  const toBeLeft = ({ pileId, pieceId }: Piece) => {
    if (!ctx.isClientMoveAllowed) return false;
    if (validHoveredPiece === null) return false;
    if (pileId !== validHoveredPiece.pileId) return false;
    if (validHoveredPiece.pieceId === board[pileId] - 1) return false;
    if (pieceId > validHoveredPiece.pieceId) return false;
    return true;
  };

  const toBeRemoved = (pileId) => {
    if (!ctx.isClientMoveAllowed) return false;
    if (validHoveredPiece === null) return false;
    return validHoveredPiece.pileId !== pileId;
  };

  const currentChoiceDescription = (pileId) => {
    const pieceCountInPile = board[pileId];

    if (!ctx.isClientMoveAllowed) return pieceCountInPile;
    if (!validHoveredPiece) return pieceCountInPile;
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
          {range(board[pileId]).map(pieceId => (
            <button
              key={pieceId}
              disabled={isDisabled({ pileId, pieceId })}
              className={`
                bg-blue-800 w-[20%] aspect-square rounded-full mx-0.5 mt-0.5 align-top
                ${toBeRemoved(pileId) ? 'bg-slate-900/40 dark:bg-white/20' : ''}
                ${toBeLeft({ pileId, pieceId }) ? 'bg-blue-800/75' : ''}
              `}
              onClick={() => clickPiece({ pileId, pieceId })}
              {...(isDisabled({ pileId, pieceId }) ? {} : hoverProps({ pileId, pieceId }))}
            >
              {!isDisabled({ pileId, pieceId }) &&
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
  hu: 'Kattints a korongra, ahol ketté akarod vágni a kupacot.',
  en: 'Click the piece where you want to split the pile.'
});

export const moves = {
  removePile: {
    validate: (board: Board, _, pileId: number) => isRemovalAllowed(board, pileId),
    // First half of the turn: discard a pile, then split the other — the turn
    // stays open in between.
    apply: (board: Board, _, pileId): MoveOutcome<Board> =>
      ({ nextBoard: withPileRemoved(board, pileId) })
  },
  splitPile: {
    validate: (board: Board, _, { pileId, pieceCount }: { pileId: number; pieceCount: number }) =>
      isSplitAllowed(board, pileId, pieceCount),
    apply: (board: Board, { ctx }: { ctx: Ctx }, { pileId, pieceCount }): MoveOutcome<Board> => {
      const nextBoard = [pieceCount, board[pileId] - pieceCount];
      // Two single-piece piles cannot be split, so the opponent is stuck.
      if (isEqual(nextBoard, [1, 1])) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;

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
      // smart bot: verified as optimal
      botStrategy: smartBotStrategy,
      generateStartBoard: () => ([random(3, 10), random(3, 10)]),
      label: { hu: 'Teljes', en: 'Full' },
      isDefault: true
    }
  ]
});
