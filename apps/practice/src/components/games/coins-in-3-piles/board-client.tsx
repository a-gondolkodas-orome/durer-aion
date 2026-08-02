import { range } from 'lodash';
import { useTranslation } from '../../../language';
import type { Board } from './helpers';
import { GameBoard, type BoardClientProps, useHoverPreview } from '../../strategy-game-factory';

const getCoinBgColor = (coinValue) => {
  if (coinValue === 1) return 'bg-yellow-700';
  if (coinValue === 2) return 'bg-stone-500';
  return 'bg-yellow-400';
};
const getCoinShadowColor = (coinValue) => {
  if (coinValue === 1) return 'shadow-yellow-700';
  if (coinValue === 2) return 'shadow-stone-500';
  return 'shadow-yellow-400';
};

export const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();
  const valueOfRemovedCoin = (ctx.turnState as { removedCoinValue: number } | null)?.removedCoinValue ?? null;
  const { value: validHoveredPile, hoverProps } = useHoverPreview<number>(ctx.moveCount);

  const wasCoinAlreadyRemovedInTurn = valueOfRemovedCoin !== null;

  const isRemovalAllowed = coinValue => moves.removeCoin.isAllowed(board, coinValue);
  const isAddAllowed = coinValue => moves.addCoin.isAllowed(board, coinValue);
  const isPassAllowed = () => moves.passAddition.isAllowed(board);


  const shouldShowCoinToBeRemoved = (coinValue) => {
    if (!ctx.isClientMoveAllowed) return false;
    if (wasCoinAlreadyRemovedInTurn) return false;
    return coinValue === validHoveredPile && board[coinValue - 1] !== 0;
  };

  const shouldShowCoinToBeAdded = (coinValue) => {
    if (!wasCoinAlreadyRemovedInTurn) return false;
    return valueOfRemovedCoin! > coinValue && coinValue === validHoveredPile;
  };

  return (
    <GameBoard>

      <div
        className={`
          flex items-end gap-4 flex-wrap ${!wasCoinAlreadyRemovedInTurn ? 'opacity-40' : ''}
        `}
      >
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-sm">
            {t({ hu: 'Visszarakás:', en: 'Place back:' })}
          </span>
          <div className="flex gap-2">
            <button
              disabled={!isPassAllowed()}
              className="secondary-button w-auto"
              onClick={() => moves.passAddition(board)}
            >
              {t({ hu: 'Semmi ∅', en: 'Nothing ∅' })}
            </button>
            {[1, 2].map(coinValue => (
              <button
                key={coinValue}
                disabled={!isAddAllowed(coinValue)}
                className={`
                  primary-button w-auto min-w-[4ch] rounded-2xl
                  ${getCoinBgColor(coinValue)} enabled:hocus:brightness-75
                `}
                onClick={() => moves.addCoin(board, coinValue)}
                {...(isAddAllowed(coinValue) ? hoverProps(coinValue) : {})}
              >{coinValue}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4 my-2 border-t pt-2">
        {[1, 2, 3].map(coinValue => (
          <span key={coinValue} className="flex items-center gap-1 text-sm font-semibold">
            <span className={`w-4 h-4 rounded-full ${getCoinBgColor(coinValue)}`} />
            {coinValue}
            <span className="font-normal">× {board[coinValue - 1]}</span>
          </span>
        ))}
      </div>

      <div className="text-center" style={{ transform: 'scaleY(-1)' }}>
        {[1, 2, 3].map(coinValue => (
          <span key={coinValue}>
            {range(board[coinValue - 1]).map(i => (
              <button
                key={i}
                disabled={!isRemovalAllowed(coinValue)}
                className={`
                  w-[15%] aspect-square rounded-full mr-0.5 mt-2 text-slate-800
                  ${getCoinBgColor(coinValue)} shadow-md ${getCoinShadowColor(coinValue)}
                  enabled:hocus:ring-2 enabled:hocus:ring-red-400
                  ${shouldShowCoinToBeRemoved(coinValue) && i === (board[coinValue - 1] - 1)
                    ? 'opacity-50' : ''}
                `}
                style={{ transform: 'scaleY(-1)' }}
                onClick={() => moves.removeCoin(board, coinValue)}
                {...(isRemovalAllowed(coinValue) ? hoverProps(coinValue) : {})}
              >{coinValue}</button>
            ))}
            {shouldShowCoinToBeAdded(coinValue) && (
              <button
                disabled
                className={`
                  w-[15%] aspect-square rounded-full mr-0.5 mt-2 opacity-50 text-slate-800
                  ${getCoinBgColor(coinValue)} shadow-md ${getCoinShadowColor(coinValue)}
                `}
                style={{ transform: 'scaleY(-1)' }}
              >{coinValue}</button>
            )}
          </span>
        ))}
      </div>

    </GameBoard>
  );
};
