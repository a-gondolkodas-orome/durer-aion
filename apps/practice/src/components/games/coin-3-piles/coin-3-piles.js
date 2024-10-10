import React, { useState } from 'react';
import { range } from 'lodash';
import { getGameStateAfterMove  } from './strategy/strategy';

export const BoardClient = ({ board, ctx, events, moves }) => {
  const [valueOfRemovedCoin, setValueOfRemovedCoin] = useState(null);
  const [hoveredPile, setHoveredPile] = useState(null);

  const wasCoinAlreadyRemovedInTurn = valueOfRemovedCoin !== null;

  const isRemovalAllowed = coinValue => {
    if (!ctx.shouldPlayerMoveNext) return false;
    if (wasCoinAlreadyRemovedInTurn) return false;
    return board[coinValue] !== 0;
  };

  const isAddAllowed = coinValue => {
    if (!ctx.shouldPlayerMoveNext) return false;
    if (!wasCoinAlreadyRemovedInTurn) return false;
    return coinValue < valueOfRemovedCoin;
  };

  const undoCoinRemoval = () => {
    const nextBoard = [...board];
    nextBoard[valueOfRemovedCoin] += 1;
    moves.setBoard(nextBoard);
    events.setTurnStage(null);
    setValueOfRemovedCoin(null);
  };

  const removeFromPile = coinValue => {
    if (!isRemovalAllowed(coinValue)) return;

    setValueOfRemovedCoin(coinValue);
    events.setTurnStage('placeBack');
    const nextBoard = [...board];
    nextBoard[coinValue] -= 1;
    moves.setBoard(nextBoard);
    if (coinValue === 0) endTurn(nextBoard);
  };

  const addToPile = (coinValue) => {
    if (!isAddAllowed(coinValue)) return;

    const nextBoard = [...board];
    nextBoard[coinValue] += 1;
    endTurn(nextBoard);
  };

  const resetTurnState = () => {
    setHoveredPile(null);
    setValueOfRemovedCoin(null);
    events.setTurnStage(null);
  };
  const endTurn = (nextBoard) => {
    events.endPlayerTurn(getGameStateAfterMove(nextBoard));
    resetTurnState();
  };
  const getCoinBgColor = (coinValue) => {
    if (coinValue === 0) return 'bg-yellow-700';
    if (coinValue === 1) return 'bg-slate-500';
    return 'bg-yellow-400';
  };
  const getCoinShadowColor = (coinValue) => {
    if (coinValue === 0) return 'shadow-yellow-700';
    if (coinValue === 1) return 'shadow-slate-500';
    return 'shadow-yellow-400';
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

  return (
  <section className="p-2 shrink-0 grow basis-2/3">
    <div className="text-center" style={{ transform: 'scaleY(-1)' }}>
    {[0, 1, 2].map(coinValue => (
      <span key={coinValue}>
        {range(board[coinValue]).map(i => (
          <button
            key={`${i}-${shouldShowCoinToBeAdded(coinValue)}`}
            disabled={!isRemovalAllowed(coinValue)}
            className={`
              w-[15%] aspect-square inline-block rounded-full mr-0.5 mt-1
              ${getCoinBgColor(coinValue)} shadow-md ${getCoinShadowColor(coinValue)}
              ${shouldShowCoinToBeRemoved(coinValue) && i === (board[coinValue] - 1) ? 'opacity-50' : ''}
            `}
            style={{ transform: 'scaleY(-1)' }}
            onClick={() => removeFromPile(coinValue)}
            onMouseOver={() => {if (!wasCoinAlreadyRemovedInTurn) setHoveredPile(coinValue)}}
            onMouseOut={() => setHoveredPile(null)}
            onFocus={() => {if (!wasCoinAlreadyRemovedInTurn) setHoveredPile(coinValue)}}
            onBlur={() => setHoveredPile(null)}
          >{coinValue+1}</button>
        ))}
        {shouldShowCoinToBeAdded(coinValue) && (
          <button
            disabled
            key="to-be-added"
            className={`
              w-[15%] aspect-square inline-block rounded-full mr-0.5 mt-1 opacity-50
              ${getCoinBgColor(coinValue)} shadow-md ${getCoinShadowColor(coinValue)}
            `}
            style={{ transform: 'scaleY(-1)' }}
          >{coinValue+1}</button>
        )}
      </span>))}
    </div>
    <hr className="my-4"></hr>
    <table className="mx-2 table-fixed w-full">
      <tbody>
        <tr>
          <td key="nothing" className="px-2">
            <button
              disabled={!isAddAllowed(0)}
              className="cta-button text-sm px-1"
              onClick={() => endTurn(board)}
            >
              Semmit se rakok be
            </button>
          </td>
          {[0, 1].map(coinValue =>
            <td key={coinValue} className="text-center">
              <button
                disabled={!isAddAllowed(coinValue)}
                className={`
                  inline-block w-[30%] aspect-square rounded-full mx-0.5
                  ${getCoinBgColor(coinValue)} shadow-md ${getCoinShadowColor(coinValue)}
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                onClick={() => addToPile(coinValue)}
                onMouseOver={() => {if (wasCoinAlreadyRemovedInTurn) setHoveredPile(coinValue)}}
                onMouseOut={() => setHoveredPile(null)}
                onFocus={() => {if (wasCoinAlreadyRemovedInTurn) setHoveredPile(coinValue)}}
                onBlur={() => setHoveredPile(null)}
              >{coinValue+1}</button>
            </td>
          )}
        </tr>
      </tbody>
    </table>
    <hr className="my-4"></hr>
    <button
      disabled={!wasCoinAlreadyRemovedInTurn}
      className="w-[30%] m-auto cta-button bg-slate-400 text-sm px-1"
      onClick={undoCoinRemoval}
    >
      ↶ Visszavonás
    </button>
  </section>
  );
};

export const getPlayerStepDescription = ({ ctx: { turnStage } }) => {
  if (turnStage === 'placeBack') {
    return 'Kattints egy érmére a kupac alatt, hogy visszatégy egy olyan pénzérmét.';
  }
  return 'Kattints egy érmére, hogy elvegyél egy olyan pénzérmét.';
};
