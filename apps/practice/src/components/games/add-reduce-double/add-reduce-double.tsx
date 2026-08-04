import { range, isEqual, random, cloneDeep } from 'lodash';
import {
  strategyGameFactory, type BoardClientProps, type Ctx, type MoveOutcome, GameBoard, useHoverPreview
} from '../../strategy-game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';

export type Board = number[];
type Piece = { pileId: number; pieceId: number };

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { value: validHoveredPiece, hoverProps } = useHoverPreview<Piece>(ctx.moveCount);

  const nonExistent = ({ pileId, pieceId }: Piece) => {
    return pieceId >= board[pileId];
  };

  // Clicking piece `pieceId` removes it and everything above it (from the top),
  // i.e. `board[pileId] - pieceId` pieces — so the piece is clickable exactly
  // when that is a legal transfer.
  const isDisabled = ({ pileId, pieceId }: Piece) =>
    !moves.moveHalvedPieces.isAllowed(board, { pileId, pieceCount: board[pileId] - pieceId });

  // The pieces removed by clicking the hovered piece: it and everything above it.
  const removedCount = () => (validHoveredPiece ? board[validHoveredPiece.pileId] - validHoveredPiece.pieceId : 0);

  const toBeRemoved = ({ pileId, pieceId }: Piece) => {
    if (validHoveredPiece === null) return false;
    if (pileId !== validHoveredPiece.pileId) return false;
    if (pieceId < validHoveredPiece.pieceId) return false;
    return true;
  };

  const toAppear = ({ pileId, pieceId }: Piece) => {
    if (validHoveredPiece === null) return false;
    if(pileId === validHoveredPiece.pileId) return false;
    if(pieceId > board[pileId] + removedCount() / 2 - 1) return false;
    return true;
  };

  const currentChoiceDescription = (pileId) => {
    const pieceCountInPile = board[pileId];

    if (!ctx.isClientMoveAllowed) return pieceCountInPile;
    if (!validHoveredPiece) return pieceCountInPile;

    if (validHoveredPiece.pileId !== pileId) {
      return `${pieceCountInPile} → ${pieceCountInPile + removedCount() / 2 }`;
    }

    return `${pieceCountInPile} → ${pieceCountInPile - removedCount()}`;
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
          {range(20).map(pieceId => (
            <button
              key={pieceId}
              disabled={isDisabled({ pileId, pieceId })}
              className={`
                w-[18%] aspect-square rounded-full mx-0.5 mt-0.5 align-top
                ${toAppear({ pileId, pieceId }) && nonExistent({ pileId, pieceId }) ? 'bg-blue-800/50' : ''}
                ${toBeRemoved({ pileId, pieceId }) ? 'bg-slate-900/40 dark:bg-white/20' : ''}
                ${
                  (nonExistent({ pileId, pieceId }) && !toAppear({ pileId, pieceId }))
                    ? 'invisible inline-block'
                    : 'inline-block'
                }
                ${!nonExistent({ pileId, pieceId }) && !toBeRemoved({ pileId, pieceId }) ? 'bg-blue-800' : ''}
              `}
              onClick={() => moves.moveHalvedPieces(board, { pileId, pieceCount: board[pileId] - pieceId })}
              {...(isDisabled({ pileId, pieceId }) ? {} : hoverProps({ pileId, pieceId }))}
            >
              {!isDisabled({ pileId, pieceId }) &&
              <p className="text-sm" style={{ transform: 'scaleY(-1)' }}>
                -{board[pileId] - pieceId};+{(board[pileId] - pieceId) / 2}
              </p>}
            </button>
          ))}
      </div>
    ))}
  </GameBoard>
  );
};

// An even number of pieces, at least two, and no more than the pile holds —
// half of them then go to the other pile. Both players draw on the same two
// piles, so whose turn it is does not enter into legality.
export const isTransferAllowed = (board: Board, { pileId, pieceCount }): boolean =>
  (pileId === 0 || pileId === 1)
    && Number.isInteger(pieceCount)
    && pieceCount >= 2
    && pieceCount % 2 === 0
    && pieceCount <= board[pileId];

export const moves = {
  moveHalvedPieces: {
    validate: (board: Board, _, piece) => isTransferAllowed(board, piece),
    apply: (board: Board, { ctx }: { ctx: Ctx }, { pileId, pieceCount }): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard[pileId] -= pieceCount;
      nextBoard[1 - pileId] += pieceCount / 2;
      const isGameEnd = isEqual(nextBoard, [1, 1]) || isEqual(nextBoard, [0, 1]) || isEqual(nextBoard, [1, 0]);
      if (isGameEnd) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;

const rule = {
  hu: <>
    A pályán mindig két kupac korong található. Egy lépésben az éppen soron következő játékos az egyik
    kupacból elvesz páros sok korongot (legalább kettőt), és a másik kupachoz hozzáad feleannyit.
    Az veszít, aki nem tud lépni.
  </>,
  en: <>
    We have two piles of pieces. In each step, the current player adds at least one piece
    to one of the piles and takes away two times as many pieces from the other pile. The player who
    cannot move loses.
  </>
};

export const AddReduceDouble = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription: () => ({
      hu: 'Kattints egy korongra, hogy jelezd, hány korongot szeretnél elvenni a kupacból.',
      en: 'Click a piece to indicate how many you want to remove.'
    })
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      generateStartBoard: () => ([random(2, 5), random(2, 5)]),
      label: { hu: 'Teszt', en: 'Test' }
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
