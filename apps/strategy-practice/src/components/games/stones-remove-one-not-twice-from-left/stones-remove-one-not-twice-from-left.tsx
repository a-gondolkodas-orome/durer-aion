import type { BoardClientProps, StrategyGameConfig } from 'strategy-engine';
import { Trans, useTranslation } from 'react-i18next';
import { GameBoard, useHoverPreview } from 'strategy-engine/react';
import { testVariantLabel, fullVariantLabel } from 'strategy-game-factory';
import { range } from 'lodash';
import { fullStartBoards, testStartBoards, moves, type Board } from './gameplay';
import { randomBotStrategy, smartBotStrategy } from './bot-strategy';

const StonePile = ({ count, onClick, disabled, restricted, hovered, hoverProps }: {
  count: number
  onClick: () => void
  disabled: boolean
  restricted: boolean
  hovered: boolean
  // `useHoverPreview`'s hoverProps(value), or {} on a pile that may not drive
  // a preview — either way a bag of handlers to spread onto the button.
  hoverProps: Record<string, () => void>
}) => {
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
  const { t } = useTranslation('stones-remove-one-not-twice-from-left');
  const { value: hoveredPile, hoverProps } = useHoverPreview<number>(ctx.moveCount);

  const isMoveAllowed = (pileId: number) => moves.removeStone.isAllowed(board, pileId);

  return (
    <GameBoard>
      <div className="flex">
        {[0, 1].map(pileId => (
          <div key={pileId} className="grow px-2 flex flex-col">
            <h2 className="text-center">
              {pileId === 0 ? t('board.left') : t('board.right')}
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

const Rule = () => {
  const { t } = useTranslation('stones-remove-one-not-twice-from-left');
  return <Trans t={t} i18nKey="rule" />;
};

const StepDescription = () => {
  const { t } = useTranslation('stones-remove-one-not-twice-from-left');
  return t('step');
};

export const stonesRemoveOneNotTwiceFromLeftConfig: StrategyGameConfig<Board> = {
  presentation: {
    rule: <Rule />,
    getPlayerStepDescription: () => <StepDescription />
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      startBoards: testStartBoards,
      label: testVariantLabel
    },
    {
      botStrategy: smartBotStrategy,
      startBoards: fullStartBoards,
      label: fullVariantLabel,
      isDefault: true
    }
  ]
};
