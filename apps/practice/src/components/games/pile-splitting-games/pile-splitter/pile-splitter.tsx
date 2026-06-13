import { useState } from 'react';
import { range, isEqual, random, cloneDeep } from 'lodash';
import { strategyGameFactory, type BoardClientProps, type Events, GameBoard } from '../../../game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';

export type Board = number[];
type Piece = { pileId: number; pieceId: number };
type HoveredPiece = { pileId: number; pieceId: number; moveCount: number } | null;

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const [hoveredPiece, setHoveredPiece] = useState<HoveredPiece>(null);
  const validHoveredPiece = (
    hoveredPiece?.moveCount === ctx.moveCount
    && hoveredPiece?.pieceId < board[hoveredPiece?.pileId] - 1
  ) ? hoveredPiece : null;

  const isDisabled = ({ pileId, pieceId }: Piece) => {
    if (!ctx.isClientMoveAllowed) return true;
    return pieceId === board[pileId] - 1;
  };

  const clickPiece = ({ pileId, pieceId }: Piece) => {
    if (isDisabled({ pileId, pieceId })) return;

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
                bg-blue-800 w-[20%] aspect-square rounded-full mx-0.5 mt-0.5
                ${toBeRemoved(pileId) ? 'bg-slate-900/40' : ''}
                ${toBeLeft({ pileId, pieceId }) ? 'bg-blue-800/75' : ''}
              `}
              onClick={() => clickPiece({ pileId, pieceId })}
              onFocus={() => setHoveredPiece({ pileId, pieceId, moveCount: ctx.moveCount })}
              onBlur={() => setHoveredPiece(null)}
              onPointerEnter={() => setHoveredPiece({ pileId, pieceId, moveCount: ctx.moveCount })}
              onPointerMove={() => setHoveredPiece({ pileId, pieceId, moveCount: ctx.moveCount })}
              onPointerLeave={() => setHoveredPiece(null)}
            ></button>
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

const moves = {
  removePile: (board: Board, _, pileId) => {
    const nextBoard = cloneDeep(board);
    nextBoard[pileId] = 0;
    return { nextBoard };
  },
  splitPile: (board: Board, { events }: { events: Events }, { pileId, pieceCount }) => {
    const nextBoard = [pieceCount, board[pileId] - pieceCount];
    events.endTurn();
    if (isEqual(nextBoard, [1, 1])) {
      events.endGame();
    }
    return { nextBoard };
  }
};

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
      label: { hu: 'Teszt 🤖', en: 'Test 🤖' },
      generateStartBoard: () => ([random(2, 5), random(2, 5)])
    },
    {
      // smart bot: verified as optimal
      botStrategy: smartBotStrategy,
      generateStartBoard: () => ([random(3, 10), random(3, 10)]),
      label: { hu: 'Okos 🤖', en: 'Smart 🤖' },
      isDefault: true
    }
  ]
});
