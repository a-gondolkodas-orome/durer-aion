import { range, random } from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  strategyGameFactory, testVariantLabel, fullVariantLabel, type BoardClientProps, GameBoard, useHoverPreview
} from 'strategy-game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { moves, type Board, type Piece } from './gameplay';

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { value: validHoveredPiece, hoverProps } = useHoverPreview<Piece>(ctx.moveCount);

  const nonExistent = ({ pileId, pieceId }: Piece) => {
    return pieceId >= board[pileId];
  };

  // Clicking piece `pieceId` removes it and everything above it (from the top),
  // i.e. `board[pileId] - pieceId` pieces — so the piece is clickable exactly
  // when that is a legal transfer.
  const isDisabled = ({ pileId, pieceId }: Piece) =>
    !moves.moveHalvedPieces.isAllowed(board, { pileId, pieceCount: board[pileId] - pieceId });

  // The pieces removed by clicking the hovered piece: it and everything above it.
  const removedCount = () => (validHoveredPiece ? board[validHoveredPiece.pileId] - validHoveredPiece.pieceId : 0);

  const toBeRemoved = ({ pileId, pieceId }: Piece) => {
    if (validHoveredPiece === null) return false;
    if (pileId !== validHoveredPiece.pileId) return false;
    if (pieceId < validHoveredPiece.pieceId) return false;
    return true;
  };

  const toAppear = ({ pileId, pieceId }: Piece) => {
    if (validHoveredPiece === null) return false;
    if (pileId === validHoveredPiece.pileId) return false;
    if (pieceId > board[pileId] + removedCount() / 2 - 1) return false;
    return true;
  };

  const currentChoiceDescription = (pileId: number) => {
    const pieceCountInPile = board[pileId];

    if (!ctx.isClientMoveAllowed) return pieceCountInPile;
    if (!validHoveredPiece) return pieceCountInPile;

    if (validHoveredPiece.pileId !== pileId) {
      return `${pieceCountInPile} → ${pieceCountInPile + removedCount() / 2 }`;
    }

    return `${pieceCountInPile} → ${pieceCountInPile - removedCount()}`;
  };

  return (
  <GameBoard>
    {[0, 1].map(pileId => (
      <div
        key={pileId}
        className={`
          w-[50%] pl-1 inline-block text-center
          ${pileId === 0 && board[0] >= board[1] ? 'border-r-2' : ''}
          ${pileId === 1 && board[0] < board[1] ? 'border-l-2' : ''}
        `}
        style={{ transform: 'scaleY(-1)' }}
      >
        <p className="text-xl" style={{ transform: 'scaleY(-1)' }}>
          {currentChoiceDescription(pileId)}
        </p>
          {range(20).map(pieceId => (
            <button
              key={pieceId}
              disabled={isDisabled({ pileId, pieceId })}
              className={`
                w-[18%] aspect-square rounded-full mx-0.5 mt-0.5 align-top
                ${toAppear({ pileId, pieceId }) && nonExistent({ pileId, pieceId }) ? 'bg-blue-800/50' : ''}
                ${toBeRemoved({ pileId, pieceId }) ? 'bg-slate-900/40 dark:bg-white/20' : ''}
                ${
                  (nonExistent({ pileId, pieceId }) && !toAppear({ pileId, pieceId }))
                    ? 'invisible inline-block'
                    : 'inline-block'
                }
                ${!nonExistent({ pileId, pieceId }) && !toBeRemoved({ pileId, pieceId }) ? 'bg-blue-800' : ''}
              `}
              onClick={() => moves.moveHalvedPieces(board, { pileId, pieceCount: board[pileId] - pieceId })}
              {...(isDisabled({ pileId, pieceId }) ? {} : hoverProps({ pileId, pieceId }))}
            >
              {!isDisabled({ pileId, pieceId }) &&
              <p className="text-sm" style={{ transform: 'scaleY(-1)' }}>
                -{board[pileId] - pieceId};+{(board[pileId] - pieceId) / 2}
              </p>}
            </button>
          ))}
      </div>
    ))}
  </GameBoard>
  );
};

const Rule = () => {
  const { t } = useTranslation('add-reduce-double');
  return t('rule');
};

const StepDescription = () => {
  const { t } = useTranslation('add-reduce-double');
  return t('step');
};

export const AddReduceDouble = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    getPlayerStepDescription: () => <StepDescription />
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      generateStartBoard: () => ([random(2, 5), random(2, 5)]),
      label: testVariantLabel
    },
    {
      botStrategy: smartBotStrategy,
      generateStartBoard: () => ([random(3, 10), random(3, 10)]),
      label: fullVariantLabel,
      isDefault: true
    }
  ]
});
