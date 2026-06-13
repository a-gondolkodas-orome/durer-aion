import { useState } from 'react';
import { range, random, cloneDeep } from 'lodash';
import { strategyGameFactory, type BoardClientProps, type Events, GameBoard } from '../../../game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { useLanguage } from '../../../language';

export type Board = number[];
type Piece = { pileId: number; pieceId: number };
type HoveredPiece = (Piece & { moveCount: number }) | null;

const generateStartBoard = (): Board => ([random(0, 9), random(0, 9), random(0, 9), random(4, 9)]);
const generateTestStartBoard = (): Board => ([random(0, 6), random(0, 6), random(0, 6), random(4, 6)]);

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { language } = useLanguage();
  const [hoveredPiece, setHoveredPiece] = useState<HoveredPiece>(null);
  const validHoveredPiece = hoveredPiece?.moveCount === ctx.moveCount ? hoveredPiece : null;

  const nonExistent = ({ pileId, pieceId }: Piece) => {
    return pieceId >= board[pileId];
  };

  const isDisabled = ({ pileId, pieceId }: Piece) => {
    if (!ctx.isClientMoveAllowed) return true;
    return pieceId>pileId-1 || (pieceId>board[pileId]-1);
  };

  const hoverPiece = (piece: HoveredPiece) => {
    if (piece === null) {
      setHoveredPiece(null);
      return;
    }
    if (isDisabled(piece)) return;
    setHoveredPiece(piece);
  };

  const clickPiece = ({ pileId, pieceId }: Piece) => {
    if (isDisabled({ pileId, pieceId })) return;

    moves.spreadPieces(board, { pileId, pieceCount: pieceId + 1 });
    setHoveredPiece(null);
  };

  const toBeRemoved = ({ pileId, pieceId }: Piece) => {
    if (validHoveredPiece === null) return false;
    if (pileId !== validHoveredPiece.pileId) return false;
    if (pieceId > validHoveredPiece.pieceId) return false;
    return true;
  };

  const toAppear = ({ pileId, pieceId }: Piece) => {
    if (validHoveredPiece === null) return false;
    return (
      (pileId<validHoveredPiece.pileId) &&
      (pileId>validHoveredPiece.pileId-validHoveredPiece.pieceId-2) &&
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
      return `${pileId+1}. ${pileName}: ${pieceCountInPile} → ${pieceCountInPile - validHoveredPiece.pieceId - 1}`;
    }
    if ((pileId<validHoveredPiece.pileId) && (pileId>validHoveredPiece.pileId-validHoveredPiece.pieceId-2)) {
      return `${pileId+1}. ${pileName}: ${pieceCountInPile} → ${pieceCountInPile + 1}`;
    }
    return `${pileId+1}. ${pileName}: ${pieceCountInPile} `;
  };

  const pieceVisibility = ({ pileId, pieceId }: Piece) => {
    if (nonExistent({ pileId, pieceId }) && !toAppear({ pileId, pieceId })) return 'invisible inline-block';
    return 'inline-block';
  };

  const pieceColor = ({ pileId, pieceId }: Piece) => {
    if (toBeRemoved({ pileId, pieceId })) return 'bg-slate-900/40';
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
              onClick={() => clickPiece({ pileId, pieceId })}
              onFocus={() => hoverPiece({ pileId, pieceId, moveCount: ctx.moveCount })}
              onBlur={() => hoverPiece(null)}
              onPointerEnter={() => hoverPiece({ pileId, pieceId, moveCount: ctx.moveCount })}
              onPointerMove={() => hoverPiece({ pileId, pieceId, moveCount: ctx.moveCount })}
              onPointerLeave={() => hoverPiece(null)}
            >
              {!isDisabled({ pileId, pieceId }) &&
              <p className="text-sm" style={{ transform: 'scaleY(-1)' }}>
                {pieceId + 1}
              </p>}
            </button>
          ))}
      </div>
    ))}
  </GameBoard>
  );
};

const moves = {
  spreadPieces: (board: Board, { events }: { events: Events }, { pileId, pieceCount }) => {
    if (pieceCount > pileId) console.error('invalid_move');
    const nextBoard = cloneDeep(board);
    nextBoard[pileId] = board[pileId] - pieceCount;
    for (let i = pileId - pieceCount; i < pileId; i++) {
      nextBoard[i] = board[i] + 1;
    }
    const isGameEnd = nextBoard[1]===0 && nextBoard[2]===0 && nextBoard[3]===0;
    events.endTurn();
    if (isGameEnd) {
      events.endGame();
    }
    return { nextBoard };
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
      label: { hu: 'Teszt 🤖', en: 'Test 🤖' }
    },
    // smart bot: verified as optimal
    { botStrategy: smartBotStrategy, generateStartBoard, label: { hu: 'Okos 🤖', en: 'Smart 🤖' }, isDefault: true }
  ]
});
