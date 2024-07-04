import React, { useState } from 'react';
import { range } from 'lodash';
import { getGameStateAfterMove  } from './strategy/strategy';

export const GameBoard = ({ board, setBoard, ctx }) => {
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
      ctx.setTurnStage('placeBack');
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
    ctx.setTurnStage(null);
  };
  const endTurn = (newBoard) => {
    ctx.endPlayerTurn(getGameStateAfterMove(newBoard));
    resetTurnState();
  };
  const getCoinColor = (coinValue) => {
    if (coinValue === 0) return 'bg-yellow-700';
    if (coinValue === 1) return 'bg-slate-500';
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
                style={{ transform: 'scaleY(-1)' }}
                disabled={!isMoveAllowed(coinValue)}
                onMouseOver={() => setHoveredPile(coinValue)}
                onMouseOut={() => setHoveredPile(null)}
                onFocus={() => setHoveredPile(coinValue)}
                onBlur={() => setHoveredPile(null)}
              >
                {range(board[coinValue]).map(i => (
                  <span
                    key={`${board[coinValue]}-${i}-${shouldShowCoinToBeAdded(coinValue)}`}
                    className={`
                      w-[30%] aspect-square inline-block rounded-full mr-0.5 mt-0.5
                      ${getCoinColor(coinValue)}
                      ${shouldShowCoinToBeRemoved(coinValue) && i === (board[coinValue] - 1) ? 'opacity-50' : ''}
                    `}
                    style={{ transform: 'scaleY(-1)' }}
                  ><span className='relative top-[25%]'>{coinValue+1}</span></span>
                ))}
                {shouldShowCoinToBeAdded(coinValue) && (
                  <span
                    key="to-be-added"
                    className={`
                      w-[30%] aspect-square inline-block rounded-full mr-0.5 mt-0.5 opacity-50
                      ${getCoinColor(coinValue)}
                    `}
                    style={{ transform: 'scaleY(-1)' }}
                  ><span className='relative top-[25%]'>{coinValue+1}</span></span>
                )}
              </button>
            </td>
          ))}
        </tr>
      </tbody>
    </table>
    <table className="mx-2 mt-4 table-fixed w-full">
      <tbody>
        <tr>
          {[0, 1].map(coinValue =>
            <td className="text-center">
              <button
                className={`
                  inline-block w-[30%] aspect-square rounded-full mx-0.5
                  ${getCoinColor(coinValue)}
                  ${(!wasCoinAlreadyRemovedInTurn || valueOfRemovedCoin <= coinValue) && 'opacity-50 cursor-not-allowed'}
                `}
                disabled={!wasCoinAlreadyRemovedInTurn || valueOfRemovedCoin <= coinValue}
                onClick={() => clickPile(coinValue)}
                onMouseOver={() => {if (wasCoinAlreadyRemovedInTurn) setHoveredPile(coinValue)}}
                onMouseOut={() => setHoveredPile(null)}
                onFocus={() => {if (wasCoinAlreadyRemovedInTurn) setHoveredPile(coinValue)}}
                onBlur={() => setHoveredPile(null)}
              >{coinValue+1}</button>
            </td>
          )}
          <td className="px-2">
            <button
              disabled={!wasCoinAlreadyRemovedInTurn}
              className="cta-button"
              onClick={() => endTurn(board)}
            >
              Semmit se rakok be
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
  );
};

export const getPlayerStepDescription = ({ turnStage }) => {
  if (turnStage === 'placeBack') {
    return 'Kattints egy mezőre vagy érmére, hogy visszatégy egy olyan pénzérmét';
  }
  return 'Kattints egy mezőre, hogy elvegyél egy olyan pénzérmét';
};
