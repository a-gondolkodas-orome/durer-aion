import { range, random, cloneDeep } from 'lodash';
import {
  strategyGameFactory, type BoardClientProps, type Ctx, type MoveOutcome, GameBoard, useHoverPreview
} from '../../strategy-game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { useLanguage } from '../../../language';

export type Board = number[];
type Piece = { pileId: number; pieceId: number };

const generateStartBoard = (): Board => ([random(0, 9), random(0, 9), random(0, 9), random(4, 9)]);
const generateTestStartBoard = (): Board => ([random(0, 6), random(0, 6), random(0, 6), random(4, 6)]);

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { language } = useLanguage();
  const { value: validHoveredPiece, hoverProps } = useHoverPreview<Piece>(ctx.moveCount);

  const nonExistent = ({ pileId, pieceId }: Piece) => {
    return pieceId >= board[pileId];
  };

  // Clicking piece `pieceId` removes it and everything above it (from the top),
  // i.e. `board[pileId] - pieceId` pieces.
  const isDisabled = ({ pileId, pieceId }: Piece) =>
    !moves.spreadPieces.isAllowed(board, { pileId, pieceCount: board[pileId] - pieceId });

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
    return (
      (pileId<validHoveredPiece.pileId) &&
      (pileId>validHoveredPiece.pileId-removedCount()-1) &&
      (pieceId===board[pileId])
    );
  };

  const currentChoiceDescription = (pileId) => {
    const pieceCountInPile = board[pileId];
    const pileName = language === 'en' ? 'pile' : 'kupac';

    if (!ctx.isClientMoveAllowed || !validHoveredPiece) {
      return `${pileId+1}. ${pileName}: ${pieceCountInPile}`;
    }

    if (pileId===validHoveredPiece.pileId) {
      return `${pileId+1}. ${pileName}: ${pieceCountInPile} → ${pieceCountInPile - removedCount()}`;
    }
    if ((pileId<validHoveredPiece.pileId) && (pileId>validHoveredPiece.pileId-removedCount()-1)) {
      return `${pileId+1}. ${pileName}: ${pieceCountInPile} → ${pieceCountInPile + 1}`;
    }
    return `${pileId+1}. ${pileName}: ${pieceCountInPile} `;
  };

  const pieceVisibility = ({ pileId, pieceId }: Piece) => {
    if (nonExistent({ pileId, pieceId }) && !toAppear({ pileId, pieceId })) return 'invisible inline-block';
    return 'inline-block';
  };

  const pieceColor = ({ pileId, pieceId }: Piece) => {
    if (toBeRemoved({ pileId, pieceId })) return 'bg-slate-900/40 dark:bg-white/20';
    if (toAppear({ pileId, pieceId })) return 'bg-blue-800/40';
    return 'bg-blue-800';
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

  return (
  <GameBoard>
    {[0, 1, 2, 3].map(pileId => (
      <div
        key={pileId}
        className={`
          w-[50%] pl-1 inline-block text-center
          ${pileId < 2 ? 'border-t-2': ''}
          ${rightBorder(pileId) ? 'border-r-2' : ''}
          ${leftBorder(pileId) ? 'border-l-2' : ''}
        `}
        style={{ transform: 'scaleY(-1)' }}
      >
        <p className="text-xl" style={{ transform: 'scaleY(-1)' }}>
          {currentChoiceDescription(pileId)}
        </p>
          {range(board[pileId]+5).map(pieceId => (
            <button
              key={pieceId}
              disabled={isDisabled({ pileId, pieceId })}
              className={[
                'w-[18%] aspect-square rounded-full mx-0.5 mt-0.5 align-top',
                pieceVisibility({ pileId, pieceId }),
                pieceColor({ pileId, pieceId })
              ].join(' ')}
              onClick={() => moves.spreadPieces(board, { pileId, pieceCount: board[pileId] - pieceId })}
              {...(isDisabled({ pileId, pieceId }) ? {} : hoverProps({ pileId, pieceId }))}
            >
              {!isDisabled({ pileId, pieceId }) &&
              <p className="text-sm" style={{ transform: 'scaleY(-1)' }}>
                {board[pileId] - pieceId}
              </p>}
            </button>
          ))}
      </div>
    ))}
  </GameBoard>
  );
};

// A move takes `pieceCount` pieces off pile `pileId` and puts one on each of the
// `pieceCount` piles immediately in front of it, so it can never reach past the
// first pile — hence the cap at `pileId`.
export const isSpreadAllowed = (board: Board, pileId: number, pieceCount: number): boolean =>
  Number.isInteger(pileId) && pileId >= 0 && pileId < board.length
    && Number.isInteger(pieceCount)
    && pieceCount >= 1
    && pieceCount <= pileId
    && pieceCount <= board[pileId];

export const moves = {
  spreadPieces: {
    validate: (board: Board, _, { pileId, pieceCount }: { pileId: number; pieceCount: number }) =>
      isSpreadAllowed(board, pileId, pieceCount),
    apply: (board: Board, { ctx }: { ctx: Ctx }, { pileId, pieceCount }): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard[pileId] = board[pileId] - pieceCount;
      for (let i = pileId - pieceCount; i < pileId; i++) {
        nextBoard[i] = board[i] + 1;
      }
      const isGameEnd = nextBoard[1]===0 && nextBoard[2]===0 && nextBoard[3]===0;
      if (isGameEnd) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

const rule = {
  hu: <>
    Adott négy, korongokból álló kupac, melyek 1-től 4-ig vannak számozva. Egy lépésben a
    soron következő játékos választ m és n egész számokat,
    melyekre <code className="whitespace-nowrap">1 ≤ m &lt; n ≤ 4</code>,
    majd az n sorszámú kupacból elvesz m korongot, és
    az <code className="whitespace-nowrap">n − 1, n − 2, . . . , n − m</code> sorszámú
    kupacokba egyesével szétosztja az elvett korongokat. Az veszít, aki nem tud lépni.
  </>,
  en: <>
    There are four piles of discs given, numbered from 1 to 4. Every turn the current
    player chooses integers m and n that satisfy <code className="whitespace-nowrap">1 ≤ m &lt; n ≤ 4</code> and
    takes m discs from pile number n and distributes them into the
    piles <code className="whitespace-nowrap">n − 1, n − 2, . . . , n − m</code> by
    adding one disc to every pile. The player that has no available moves loses.
  </>
};

export const FourPilesSpreadAhead = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription: () => ({
      hu: 'Kattints egy korongra, hogy jelezd, hány korongot szeretnél elvenni a kupacból.',
      en: 'Click on a disc to indicate the number of discs you want to remove.'
    })
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      generateStartBoard: generateTestStartBoard,
      label: { hu: 'Teszt', en: 'Test' }
    },
    // smart bot: verified as optimal
    { botStrategy: smartBotStrategy, generateStartBoard, label: { hu: 'Teljes', en: 'Full' }, isDefault: true }
  ]
});
