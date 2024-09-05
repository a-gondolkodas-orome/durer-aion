import React, { useState } from 'react';
import { range, isEqual, random } from 'lodash';
import { strategyGameFactory } from '../../strategy-game';
import { getBoardAfterAiTurn, isWinningState } from './strategy';

const generateStartBoard = () => {
  if (random(0, 1)) return generateWinningStartBoard();
  return generateLosingStartBoard();
};

const generateWinningStartBoard = (remainingTrials = 50) => {
  const board = [random(5, 12), random(5, 12), random(5, 12), random(5, 12)];
  if (!isWinningState(board)) {
    if (remainingTrials > 0) {
      return generateWinningStartBoard(remainingTrials - 1);
    }
    return board;
  }

  const r = random(0, 2);
  if (r === 0) return board;
  if (r === 1) return board.map(x => x * 2);
  const modifiedBoard = board.map(x => x * 2);
  modifiedBoard[random(0, 3)] -= 1;
  return modifiedBoard;
};

const generateLosingStartBoard = (remainingTrials = 50) => {
  const board = [random(5, 12), random(5, 12), random(5, 12), random(5, 12)];
  if (isWinningState(board)) {
    if (remainingTrials > 0) {
      return generateLosingStartBoard(remainingTrials - 1);
    }
    return board;
  }

  const r = random(0, 2);
  if (r === 0) return board;
  if (r === 1) return board.map(x => x * 2);
  const modifiedBoard = board.map(x => x * 2);
  modifiedBoard[random(0, 3)] -= 1;
  return modifiedBoard;
}

const isGameEnd = (board) => isEqual(board, [1, 1, 1, 1]);

const getGameStateAfterAiTurn = ({ board }) => {
  const { nextBoard, intermediateBoard } = getBoardAfterAiTurn(board);
  return { nextBoard, intermediateBoard, isGameEnd: isGameEnd(nextBoard), winnerIndex: null };
};

const getBoardAfterMove = (board, { removedPileId, splitPileId, pieceId }) => {
  const nextBoard = [...board];
  const intermediateBoard = [...board];
  intermediateBoard[removedPileId] = 0;
  if (removedPileId < splitPileId) {
    nextBoard[removedPileId] = pieceId + 1;
    nextBoard[splitPileId] = nextBoard[splitPileId] - pieceId - 1;
  } else {
    nextBoard[removedPileId] = nextBoard[splitPileId] - pieceId - 1;
    nextBoard[splitPileId] = pieceId + 1;
  }
  return { intermediateBoard, nextBoard };
};

const GameBoard = ({ board, setBoard,  ctx }) => {
  const [removedPileId, setRemovedPileId] = useState(null);
  const [hoveredPiece, setHoveredPiece] = useState(null);

  const isDisabled = ({ pileId, pieceId }) => {
    if (!ctx.shouldPlayerMoveNext) return true;
    if (removedPileId === null) return false;
    return pileId !== removedPileId && pieceId === board[pileId] - 1;
  };

  const clickPiece = ({ pileId, pieceId }) => {
    if (!ctx.shouldPlayerMoveNext) return;

    if (removedPileId === pileId) {
      setRemovedPileId(null);
      return;
    }
    if (removedPileId === null) {
      setRemovedPileId(pileId);
      return;
    }
    if (pieceId === board[pileId] - 1) return;

    const { intermediateBoard, nextBoard } = getBoardAfterMove(board, {
      removedPileId: removedPileId,
      splitPileId: pileId,
      pieceId
    });

    setBoard(intermediateBoard);

    setTimeout(() => {
      ctx.endPlayerTurn({ nextBoard, isGameEnd: isGameEnd(nextBoard), winnerIndex: null });

      setRemovedPileId(null);
      setHoveredPiece(null);
    }, 750);
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

  const toBeLeft = ({ pileId, pieceId }) => {
    if (hoveredPiece === null) return false;
    if (removedPileId === null) return false;
    if (removedPileId === pileId) return false;
    if (pileId !== hoveredPiece.pileId) return false;
    if (hoveredPiece.pieceId === board[pileId] - 1) return false;
    if (pieceId > hoveredPiece.pieceId) return false;
    return true;
  };

  const currentChoiceDescription = (pileId) => {
    const pieceCountInPile = board[pileId];

    // pieceCountInPile can be 0 in intermediateBoard during AI turn
    if (!ctx.shouldPlayerMoveNext) return pieceCountInPile || '🗑️';
    if (pileId === removedPileId) {
      if (hoveredPiece && hoveredPiece.pileId === pileId) {
        return 'Mégse?';
      }
      // pieceCountInPile can be 0 in intermediateBoard
      return pieceCountInPile ? `${pieceCountInPile} → 🗑️` : '🗑️';
    }
    if (!hoveredPiece) return pieceCountInPile || '🗑️';
    if (removedPileId === null && hoveredPiece.pileId === pileId) {
      return `${pieceCountInPile} → 🗑️`;
    }
    if (hoveredPiece.pileId !== pileId) return pieceCountInPile || '🗑️';

    return `${pieceCountInPile} → ${hoveredPiece.pieceId + 1}, ${pieceCountInPile - hoveredPiece.pieceId - 1}`;
  };

  return (
  <section className="p-2 shrink-0 grow basis-2/3">
    {[0, 1, 2, 3].map(pileId => (
      <div
        key={pileId}
        className={`
          w-[50%] pl-1 inline-block text-center py-2
          ${pileId < 2 ? 'border-t-2': ''}
          ${rightBorder(pileId) ? 'border-r-2' : ''}
          ${leftBorder(pileId) ? 'border-l-2' : ''}
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
                inline-block bg-blue-600 w-[20%] aspect-square rounded-full mx-0.5
                ${pileId === removedPileId ? 'bg-red-600 opacity-50' : ''}
                ${toBeLeft({ pileId, pieceId }) ? 'bg-blue-900' : ''}
              `}
              onClick={() => clickPiece({ pileId, pieceId })}
              onFocus={() => setHoveredPiece({ pileId, pieceId })}
              onBlur={() => setHoveredPiece(null)}
              onMouseOver={() => setHoveredPiece({ pileId, pieceId })}
              onMouseOut={() => setHoveredPiece(null)}
            ></button>
          ))}
      </div>
    ))}
  </section>
  );
};

const getPlayerStepDescription = () =>
  'Először kattints az eltávolítandó kupacra, majd arra a korongra, ahol ketté akarod vágni a kupacot.';

const rule = <>
  A pályán kezdetben négy kupac korong van.
  A soron következő játékos először az egyik kupacot teljes egészében kiveszi a játékból;
  majd egy másik kupacot kettéoszt két kisebb kupacra (mindkettőbe legalább 1 korongnak kerülnie kell).
  Egy lépést követően tehát újra 4 kupac marad. Az veszít, aki nem tud lépni.
</>;

const Game = strategyGameFactory({
  rule,
  title: 'Kupac kettéosztó 4 kupaccal',
  GameBoard,
  G: {
    getPlayerStepDescription,
    generateStartBoard,
    getGameStateAfterAiTurn
  }
});

export const PileSplitter4 = () => {
  const [board, setBoard] = useState(generateStartBoard());

  return <Game board={board} setBoard={setBoard} />;
};
