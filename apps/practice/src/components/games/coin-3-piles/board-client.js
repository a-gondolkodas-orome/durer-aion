import React, { useState } from 'react';
import { range } from 'lodash';
import { useTranslation } from '../../language/translate';

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

export const BoardClient = ({ board, ctx, moves }) => {
  const { t } = useTranslation();
  const [valueOfRemovedCoin, setValueOfRemovedCoin] = useState(null);
  const [hoveredPile, setHoveredPile] = useState(null);

  const wasCoinAlreadyRemovedInTurn = valueOfRemovedCoin !== null;

  const isRemovalAllowed = coinValue => {
    if (!ctx.isClientMoveAllowed) return false;
    if (wasCoinAlreadyRemovedInTurn) return false;
    return board[coinValue - 1] !== 0;
  };

  const isAddAllowed = coinValue => {
    if (!ctx.isClientMoveAllowed) return false;
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
  };

  const shouldShowCoinToBeRemoved = (coinValue) => {
    if (!ctx.isClientMoveAllowed) return false;
    if (wasCoinAlreadyRemovedInTurn) return false;
    return coinValue === hoveredPile && board[coinValue - 1] !== 0;
  };

  const shouldShowCoinToBeAdded = (coinValue) => {
    if (!wasCoinAlreadyRemovedInTurn) return false;
    return valueOfRemovedCoin > coinValue && coinValue === hoveredPile;
  };

  return (
    <section className="p-2 shrink-0 grow basis-2/3">

      <div className={`flex items-center gap-4 px-4 flex-wrap ${!wasCoinAlreadyRemovedInTurn ? 'opacity-40' : ''}`}>
        <span className="font-semibold">
          {t({ hu: 'Visszarakás:', en: 'Place back:' })}
        </span>
        <button
          disabled={!isAddAllowed(1)}
          className="cta-button w-auto"
          onClick={passAddition}
        >
          {t({ hu: 'Semmi', en: 'Nothing' })}
        </button>
        {[1, 2].map(coinValue => (
          <button
            key={coinValue}
            disabled={!isAddAllowed(coinValue)}
            className={`
              w-10 aspect-square rounded-full font-bold text-white
              ${getCoinBgColor(coinValue)} shadow-md ${getCoinShadowColor(coinValue)}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            onClick={() => addToPile(coinValue)}
            onMouseEnter={() => setHoveredPile(coinValue)}
            onMouseLeave={() => setHoveredPile(null)}
          >{coinValue}</button>
        ))}
        <button
          disabled={!wasCoinAlreadyRemovedInTurn}
          className="cta-button w-auto bg-rose-400 enabled:hover:bg-rose-500 text-sm ml-auto"
          onClick={undoCoinRemoval}
        >
          {t({ hu: '↶ Visszavonás', en: '↶ Undo' })}
        </button>
      </div>

      <hr className="my-4" />

      <div className="flex justify-center gap-4 mb-2">
        {[1, 2, 3].map(coinValue => (
          <span key={coinValue} className="flex items-center gap-1 text-sm font-semibold">
            <span className={`w-4 h-4 rounded-full inline-block ${getCoinBgColor(coinValue)}`} />
            {coinValue}
            <span className="text-stone-500 font-normal">× {board[coinValue - 1]}</span>
          </span>
        ))}
      </div>

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
                  ${shouldShowCoinToBeRemoved(coinValue) && i === (board[coinValue - 1] - 1)
                    ? 'opacity-50' : ''}
                `}
                style={{ transform: 'scaleY(-1)' }}
                onClick={() => removeFromPile(coinValue)}
                onMouseOver={() => { if (!wasCoinAlreadyRemovedInTurn) setHoveredPile(coinValue); }}
                onMouseOut={() => setHoveredPile(null)}
                onFocus={() => { if (!wasCoinAlreadyRemovedInTurn) setHoveredPile(coinValue); }}
                onBlur={() => setHoveredPile(null)}
              >{coinValue}</button>
            ))}
            {shouldShowCoinToBeAdded(coinValue) && (
              <button
                disabled
                className={`
                  w-[15%] aspect-square inline-block rounded-full mr-0.5 mt-2 opacity-50
                  ${getCoinBgColor(coinValue)} shadow-md ${getCoinShadowColor(coinValue)}
                `}
                style={{ transform: 'scaleY(-1)' }}
              >{coinValue}</button>
            )}
          </span>
        ))}
      </div>

    </section>
  );
};
