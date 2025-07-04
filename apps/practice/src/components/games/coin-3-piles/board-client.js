import React, { useState } from 'react';
import { range } from 'lodash';

export const BoardClient = ({ board, ctx, moves }) => {
  const [valueOfRemovedCoin, setValueOfRemovedCoin] = useState(null);
  const [hoveredPile, setHoveredPile] = useState(null);

  const wasCoinAlreadyRemovedInTurn = valueOfRemovedCoin !== null;

  const isRemovalAllowed = coinValue => {
    if (!ctx.shouldRoleSelectorMoveNext) return false;
    if (wasCoinAlreadyRemovedInTurn) return false;
    return board[coinValue - 1] !== 0;
  };

  const isAddAllowed = coinValue => {
    if (!ctx.shouldRoleSelectorMoveNext) return false;
    if (!wasCoinAlreadyRemovedInTurn) return false;
    return coinValue < valueOfRemovedCoin;
  };

  const undoCoinRemoval = () => {
    moves.undoRemoveCoin(board, valueOfRemovedCoin);
    setValueOfRemovedCoin(null);
  };

  const removeFromPile = coinValue => {
    if (!isRemovalAllowed(coinValue)) return;
    if (coinValue !== 1) {
      setValueOfRemovedCoin(coinValue);
    } else {
      setHoveredPile(null);
    }
    moves.removeCoin(board, coinValue);
  };

  const addToPile = coinValue => {
    if (!isAddAllowed(coinValue)) return;
    setValueOfRemovedCoin(null);
    setHoveredPile(null);
    moves.addCoin(board, coinValue);
  };

  const passAddition = () => {
    setValueOfRemovedCoin(null);
    setHoveredPile(null);
    moves.addCoin(board, null);
  }

  const getCoinBgColor = (coinValue) => {
    if (coinValue === 1) return 'bg-yellow-700';
    if (coinValue === 2) return 'bg-slate-500';
    return 'bg-yellow-400';
  };
  const getCoinShadowColor = (coinValue) => {
    if (coinValue === 1) return 'shadow-yellow-700';
    if (coinValue === 2) return 'shadow-slate-500';
    return 'shadow-yellow-400';
  };
  const shouldShowCoinToBeRemoved = (coinValue) => {
    if (!ctx.shouldRoleSelectorMoveNext) return false;
    if (wasCoinAlreadyRemovedInTurn) return false;
    return coinValue === hoveredPile && board[coinValue - 1] !== 0;
  };
  const shouldShowCoinToBeAdded = (coinValue) => {
    if (!wasCoinAlreadyRemovedInTurn) return false;
    return valueOfRemovedCoin > coinValue && coinValue === hoveredPile;
  };

  return (
  <section className="p-2 shrink-0 grow basis-2/3">
    <table className="mx-2 table-fixed w-full">
      <tbody>
        <tr>
          <td key="nothing" className="px-2">
            <button
              disabled={!isAddAllowed(1)}
              className="cta-button text-sm px-1"
              onClick={passAddition}
            >
              Semmit se rakok be
            </button>
          </td>
          {[1, 2].map(coinValue =>
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
              >{coinValue}</button>
            </td>
          )}
        </tr>
      </tbody>
    </table>
    <hr className="my-8 border-t-2 border-dashed border-gray-800"></hr>
    <div className="text-center" style={{ transform: 'scaleY(-1)' }}>
    {[1, 2, 3].map(coinValue => (
      <span key={coinValue}>
        {range(board[coinValue - 1]).map(i => (
          <button
            key={`${i}-${shouldShowCoinToBeAdded(coinValue)}`}
            disabled={!isRemovalAllowed(coinValue)}
            className={`
              w-[15%] aspect-square inline-block rounded-full mr-0.5 mt-2
              ${getCoinBgColor(coinValue)} shadow-md ${getCoinShadowColor(coinValue)}
              ${shouldShowCoinToBeRemoved(coinValue) && i === (board[coinValue - 1] - 1) ? 'opacity-50' : ''}
            `}
            style={{ transform: 'scaleY(-1)' }}
            onClick={() => removeFromPile(coinValue)}
            onMouseOver={() => {if (!wasCoinAlreadyRemovedInTurn) setHoveredPile(coinValue)}}
            onMouseOut={() => setHoveredPile(null)}
            onFocus={() => {if (!wasCoinAlreadyRemovedInTurn) setHoveredPile(coinValue)}}
            onBlur={() => setHoveredPile(null)}
          >{coinValue}</button>
        ))}
        {shouldShowCoinToBeAdded(coinValue) && (
          <button
            disabled
            key="to-be-added"
            className={`
              w-[15%] aspect-square inline-block rounded-full mr-0.5 mt-2 opacity-50
              ${getCoinBgColor(coinValue)} shadow-md ${getCoinShadowColor(coinValue)}
            `}
            style={{ transform: 'scaleY(-1)' }}
          >{coinValue}</button>
        )}
      </span>))}
    </div>
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
