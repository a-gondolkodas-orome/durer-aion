import React, { useState } from 'react';
import { range, sum, isEqual, random } from 'lodash';
import { strategyGameFactory } from '../strategy-game';
import { getBoardAfterAiTurn } from './strategy';

const generateNewBoard = () => {
  const board = Array(5).fill(0);
  const x = random(4);
  board[x] += 1;
  return board;
};

const isGameEnd = board => sum(board) === 10;

const getWinnerIndex = (board) => {
  if (!isGameEnd(board)) return null;
  const isAllDifferent = isEqual([...board].sort(), [0, 1, 2, 3, 4]);
  return isAllDifferent ? 1 : 0;
};

const getGameState = newBoard => ({
  newBoard,
  isGameEnd: isGameEnd(newBoard),
  winnerIndex: getWinnerIndex(newBoard)
});

const getGameStateAfterAiTurn = ({ board, playerIndex }) => {
  const newBoard = getBoardAfterAiTurn({ board, playerIndex });
  return getGameState(newBoard);
};

const GameBoard = ({ board, setBoard, ctx }) => {
  const [oneMoveDone, setOneMoveDone] = useState(false);

  const placePiece = id => {
    const newBoard = [...board];
    newBoard[id] += 1;
    if (ctx.playerIndex !== 0 && !oneMoveDone) {
      setBoard(newBoard);
      setOneMoveDone(true);
    } else {
      ctx.endPlayerTurn(getGameState(newBoard));
      setOneMoveDone(false);
    }
  };

  return (
  <section className="p-2 shrink-0 grow basis-2/3">
    <div className="grid grid-cols-3 gap-0 border-t-4 border-l-4">
      {range(board.length).map(id =>
        <button
          key={id}
          disabled={!ctx.shouldPlayerMoveNext}
          onClick={() => placePiece(id)}
          className="aspect-square border-r-4 border-b-4 p-[3%]"
        >
          {range(board[id]).map((i) =>
            <span
              key={i}
              className={`
                m-[2%] aspect-square inline-block bg-blue-600 rounded-full
                ${board[id] <= 4 ? 'w-[37%]' : (board[id] <= 6 ? 'w-[28%]': 'w-[20%]')}
              `}
            >
            </span>
          )}
      </button>
      )}
    </div>
  </section>
  );
};

const getPlayerStepDescription = () =>
  'Kattints arra a mezőre, ahova korongot szeretnél lerakni.';

const rule = <>
  A játék során egy öt mezőből álló táblára fogunk elhelyezni tíz korongot. A játék
  elején a szervező egy korongot felhelyez az egyik mezőre, és ezután kezdődik a játék. Minden
  körben a kezdőjátékos egy korongot helyez a táblára, majd ezután a második játékos tesz le két
  korongot. (A két korongot lehet azonos, illetve különböző mezőkre is tenni.) A játék akkor ér
  véget, amikor a 10. korong felkerül a táblára. A második játékos akkor nyer, ha a játék végén
  minden mezőn különböző számú korong áll. A kezdő pedig akkor nyer, ha van két olyan mező,
  amelyen azonos számú korong áll.

  Te döntheteted el, hogy a kezdő vagy a második játékos bőrébe szeretnél e bújni.
  Sok sikert! :)
</>;

const Game = strategyGameFactory({
  rule,
  title: '5 mezős játék',
  GameBoard,
  G: {
    getPlayerStepDescription,
    generateNewBoard,
    getGameStateAfterAiTurn
  }
});

export const FiveSquares = () => {
  const [board, setBoard] = useState(generateNewBoard());

  return <Game board={board} setBoard={setBoard} />;
};
