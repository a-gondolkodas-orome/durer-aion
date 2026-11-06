import { Trans, useTranslation } from 'react-i18next';
import { range } from 'lodash';
import {
  strategyGameFactory, testVariantLabel, fullVariantLabel, type BoardClientProps, GameBoard, useHoverPreview
} from 'strategy-game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { generateStartBoard, generateTestStartBoard, moves, type Board, type Piece } from './gameplay';

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation('four-piles-spread-ahead');
  const { value: validHoveredPiece, hoverProps } = useHoverPreview<Piece>(ctx.moveCount);

  const nonExistent = ({ pileId, pieceId }: Piece) => {
    return pieceId >= board[pileId];
  };

  // Clicking piece `pieceId` removes it and everything above it (from the top),
  // i.e. `board[pileId] - pieceId` pieces.
  const isDisabled = ({ pileId, pieceId }: Piece) =>
    !moves.spreadPieces.isAllowed(board, { pileId, pieceCount: board[pileId] - pieceId });

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
    return (
      (pileId < validHoveredPiece.pileId) &&
      (pileId > validHoveredPiece.pileId - removedCount() - 1) &&
      (pieceId === board[pileId])
    );
  };

  const currentChoiceDescription = (pileId: number) => {
    const pieceCountInPile = board[pileId];
    const pileName = t('board.pile', { number: pileId + 1 });

    if (!ctx.isClientMoveAllowed || !validHoveredPiece) {
      return `${pileName}: ${pieceCountInPile}`;
    }

    if (pileId === validHoveredPiece.pileId) {
      return `${pileName}: ${pieceCountInPile} → ${pieceCountInPile - removedCount()}`;
    }
    if ((pileId < validHoveredPiece.pileId) && (pileId > validHoveredPiece.pileId - removedCount() - 1)) {
      return `${pileName}: ${pieceCountInPile} → ${pieceCountInPile + 1}`;
    }
    return `${pileName}: ${pieceCountInPile} `;
  };

  const pieceVisibility = ({ pileId, pieceId }: Piece) => {
    if (nonExistent({ pileId, pieceId }) && !toAppear({ pileId, pieceId })) return 'invisible inline-block';
    return 'inline-block';
  };

  const pieceColor = ({ pileId, pieceId }: Piece) => {
    if (toBeRemoved({ pileId, pieceId })) return 'bg-slate-900/40 dark:bg-white/20';
    if (toAppear({ pileId, pieceId })) return 'bg-blue-800/40';
    return 'bg-blue-800';
  };

  const leftBorder = (pileId: number) => {
    return (
      (pileId === 1 && board[1] > board[0]) ||
      (pileId === 3 && board[3] > board[2])
    );
  };

  const rightBorder = (pileId: number) => {
    return (
      (pileId === 0 && board[1] <= board[0]) ||
      (pileId === 2 && board[3] <= board[2])
    );
  };

  return (
  <GameBoard>
    {[0, 1, 2, 3].map(pileId => (
      <div
        key={pileId}
        className={`
          w-[50%] pl-1 inline-block text-center
          ${pileId < 2 ? 'border-t-2' : ''}
          ${rightBorder(pileId) ? 'border-r-2' : ''}
          ${leftBorder(pileId) ? 'border-l-2' : ''}
        `}
        style={{ transform: 'scaleY(-1)' }}
      >
        <p className="text-xl" style={{ transform: 'scaleY(-1)' }}>
          {currentChoiceDescription(pileId)}
        </p>
          {range(board[pileId] + 5).map(pieceId => (
            <button
              key={pieceId}
              disabled={isDisabled({ pileId, pieceId })}
              className={[
                'w-[18%] aspect-square rounded-full mx-0.5 mt-0.5 align-top',
                pieceVisibility({ pileId, pieceId }),
                pieceColor({ pileId, pieceId })
              ].join(' ')}
              onClick={() => moves.spreadPieces(board, { pileId, pieceCount: board[pileId] - pieceId })}
              {...(isDisabled({ pileId, pieceId }) ? {} : hoverProps({ pileId, pieceId }))}
            >
              {!isDisabled({ pileId, pieceId }) &&
              <p className="text-sm" style={{ transform: 'scaleY(-1)' }}>
                {board[pileId] - pieceId}
              </p>}
            </button>
          ))}
      </div>
    ))}
  </GameBoard>
  );
};

const Rule = () => {
  const { t } = useTranslation('four-piles-spread-ahead');
  return <Trans t={t} i18nKey="rule" components={{ formula: <code className="whitespace-nowrap" /> }} />;
};

const StepDescription = () => {
  const { t } = useTranslation('four-piles-spread-ahead');
  return t('step');
};

export const FourPilesSpreadAhead = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    getPlayerStepDescription: () => <StepDescription />
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      generateStartBoard: generateTestStartBoard,
      label: testVariantLabel
    },
    { botStrategy: smartBotStrategy, generateStartBoard, label: fullVariantLabel, isDefault: true }
  ]
});
