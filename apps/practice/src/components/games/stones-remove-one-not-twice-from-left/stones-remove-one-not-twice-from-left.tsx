import { strategyGameFactory, type BoardClientProps, GameBoard, useHoverPreview } from 'strategy-game-factory';
import { range } from 'lodash';
import { useTranslation } from 'language';
import { fullStartBoards, testStartBoards, moves, type Board } from './gameplay';
import { randomBotStrategy, smartBotStrategy } from './bot-strategy';

const StonePile = ({ count, onClick, disabled, restricted, hovered, hoverProps }) => {
  return (
    <button
      className={`w-full flex-1 flex flex-wrap content-start justify-center gap-2 p-2
        ${restricted ? 'opacity-50' : ''}`}
      style={{ transform: 'scaleY(-1)' }}
      onClick={onClick}
      disabled={disabled}
      {...hoverProps}
    >
      {range(count).map(i => (
        <div
          key={i}
          className={`w-[20%] aspect-square rounded-full bg-stone-500 shadow-md shadow-stone-700
            transition-opacity ${hovered && i === count - 1 ? 'opacity-30' : ''}`}
          style={{ transform: 'scaleY(-1)' }}
        />
      ))}
    </button>
  );
};

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();
  const { value: hoveredPile, hoverProps } = useHoverPreview<number>(ctx.moveCount);

  const isMoveAllowed = pileId => moves.removeStone.isAllowed(board, pileId);

  return (
    <GameBoard>
      <div className="flex">
        {[0, 1].map(pileId => (
          <div key={pileId} className="grow px-2 flex flex-col">
            <h2 className="text-center">
              {t(pileId === 0 ? { hu: 'Bal', en: 'Left' } : { hu: 'Jobb', en: 'Right' })}
              {': ' + board.piles[pileId]}
            </h2>
            <StonePile
              count={board.piles[pileId]}
              onClick={() => moves.removeStone(board, pileId)}
              disabled={!isMoveAllowed(pileId)}
              restricted={ctx.isClientMoveAllowed && !isMoveAllowed(pileId)}
              hovered={hoveredPile === pileId}
              hoverProps={isMoveAllowed(pileId) ? hoverProps(pileId) : {}}
            />
          </div>
        ))}
      </div>
    </GameBoard>
  );
};

const rule = {
  hu: <>
    Két kupacban kavicsok vannak elhelyezve. A két játékos felváltva
    lép, és minden lépés során egy kavicsot kell elvenniük valamelyik kupacból.
    Egy játékos azonban nem vehet el két egymást követő lépésben a bal oldali
    kupacból. Az veszít, aki nem tud lépni.
  </>,
  en: <>
    There are two piles of stones. Players alternate turns, and on each turn a player must
    remove one stone from either pile. However, a player may not take from the
    left pile on two consecutive turns. The player who cannot move loses.
  </>
};

const getPlayerStepDescription = () => ({
  hu: 'Kattints a kupacra ahonnan el szeretnél venni egy kavicsot.',
  en: 'Click the pile you want to remove a stone from.'
});

export const StonesRemoveOneNotTwiceFromLeft = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      startBoards: testStartBoards,
      label: { hu: 'Teszt', en: 'Test' }
    },
    {
      botStrategy: smartBotStrategy,
      startBoards: fullStartBoards,
      label: { hu: 'Teljes', en: 'Full' },
      isDefault: true
    }
  ]
});
