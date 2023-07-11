import React, { useState } from 'react';
import { range, random } from 'lodash';
import { strategyGameFactory } from '../strategy-game';
import { getGameStateAfterMove, getGameStateAfterAiTurn  } from './strategy/strategy';

const generateNewBoard = () => {
  const board = [random(0, 6), random(0, 6), random(0, 6)];
  if (board[1] !== 0 || board[2] !== 0) return board;
  return generateNewBoard();
};

const GameBoard = ({ board, setBoard, ctx }) => {
  const [valueOfRemovedCoin, setValueOfRemovedCoin] = useState(null);
  const [hoveredPile, setHoveredPile] = useState(null);

  const wasCoinAlreadyRemovedInTurn = valueOfRemovedCoin !== null;

  const isMoveAllowed = (coinValue) => {
    if (!ctx.shouldPlayerMoveNext) return false;
    return !isCoinActionInvalid(coinValue);
  };
  const clickPile = (coinValue) => {
    if (!isMoveAllowed(coinValue)) return;

    if (!wasCoinAlreadyRemovedInTurn) {
      setValueOfRemovedCoin(coinValue);
      const newBoard = [...board];
      newBoard[coinValue] -= 1;
      setBoard(newBoard);
      if (coinValue === 0) endTurn(newBoard);
    } else {
      const newBoard = [...board];
      newBoard[coinValue] += 1;
      endTurn(newBoard);
    }
  };
  const resetTurnState = () => {
    setHoveredPile(null);
    setValueOfRemovedCoin(null);
  };
  const endTurn = (newBoard) => {
    ctx.endPlayerTurn(getGameStateAfterMove(newBoard));
    resetTurnState();
  };
  const getCoinColor = (coinValue) => {
    if (coinValue === 0) return 'bg-yellow-700';
    if (coinValue === 1) return 'bg-slate-700';
    return 'bg-yellow-400';
  };
  const shouldShowCoinToBeRemoved = (coinValue) => {
    if (!ctx.shouldPlayerMoveNext) return false;
    if (wasCoinAlreadyRemovedInTurn) return false;
    return coinValue === hoveredPile && board[coinValue] !== 0;
  };
  const shouldShowCoinToBeAdded = (coinValue) => {
    if (!wasCoinAlreadyRemovedInTurn) return false;
    return valueOfRemovedCoin > coinValue && coinValue === hoveredPile;
  };
  const isCoinActionInvalid = (coinValue) => {
    if (wasCoinAlreadyRemovedInTurn) {
      return valueOfRemovedCoin <= coinValue;
    }
    return board[coinValue] === 0;
  };

  return (
  <section className="p-2 shrink-0 grow basis-2/3">
    <table className="m-2 border-collapse table-fixed w-full">
      <tbody>
        <tr>
          <th>1-es</th>
          <th>2-es</th>
          <th>3-as</th>
        </tr>
        <tr>
          {[0, 1, 2].map(coinValue => (
            <td
              key={coinValue}
              onClick={() => clickPile(coinValue)}
              className={`
                text-center border-4
                ${isCoinActionInvalid(coinValue) ? 'bg-gray-300 cursor-not-allowed' : ''}
              `}
              >
              <button
                className="min-h-[25vh] w-full p-[5%]"
                disabled={!isMoveAllowed(coinValue)}
                onMouseOver={() => setHoveredPile(coinValue)}
                onMouseOut={() => setHoveredPile(null)}
                onFocus={() => setHoveredPile(coinValue)}
                onBlur={() => setHoveredPile(null)}
              >
                {range(board[coinValue]).map(i => (
                  <span
                    key={i}
                    className={`
                      w-[30%] aspect-square inline-block rounded-full mr-0.5
                      ${getCoinColor(coinValue)}
                      ${shouldShowCoinToBeRemoved(coinValue) && i === 1 ? 'opacity-50' : ''}
                    `}
                  ></span>
                ))}
                {shouldShowCoinToBeAdded(coinValue) && (
                  <span
                    className={`w-[30%] aspect-square inline-block rounded-full mr-0.5 opacity-50 ${getCoinColor(coinValue)}`}
                  ></span>
                )}
              </button>
            </td>
          ))}
        </tr>
      </tbody>
    </table>
    {valueOfRemovedCoin && (
      <button className="cta-button" onClick={() => endTurn(board)}>
        Semmit se rakok be
      </button>
    )}
  </section>
  );
};

const getPlayerStepDescription = () => {
  // TODO: conditional on turn stage?
  return 'Kattints egy mezőre, hogy elvegyél vagy visszatégy egy olyan pénzérmét';
};

const rule = <>
  Van egy kupacban néhány érme, mindegyik 1, 2 vagy 3 pengős. Egy lépésben az
  éppen soron lévő játékos elvesz egy érmét a kupacból, és helyette berakhat egy darab kisebb
  értékű érmét, vagy dönthet úgy, hogy nem tesz be semmit. Az nyer, aki elveszi az utolsó érmét
  a kupacból.

  Az új játék gombra kattintva generálhatsz egy új kezdőállást. A kezdőállás ismeretében te döntheted el, hogy kezdeni
  szeretnél-e, vagy második játékos lenni.
  Sok sikert! :)
</>;

const Game = strategyGameFactory({
  rule,
  title: '3, 2, 1 érmék',
  GameBoard,
  G: {
    getPlayerStepDescription,
    generateNewBoard,
    getGameStateAfterAiTurn
  }
});

export const Coin123 = () => {
  const [board, setBoard] = useState(generateNewBoard());

  return <Game board={board} setBoard={setBoard} />;
};
