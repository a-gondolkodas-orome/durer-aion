import { useTranslation } from 'react-i18next';
import { range } from 'lodash';
import {
  strategyGameFactory, testVariantLabel, fullVariantLabel, type BoardClientProps, type Ctx, GameBoard
} from 'strategy-game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { generateStartBoard, moves, type Board, type TurnState } from './gameplay';

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board, TurnState>) => {
  const firstPlacedSquareIndex = ctx.turnState?.firstPlacedSquareIndex ?? null;
  const showDimmedDisc = ctx.isClientMoveAllowed && firstPlacedSquareIndex !== null;

  return (
  <GameBoard>
    <div className="grid grid-cols-3 border-t-4 border-l-4">
      {range(board.length).map(id =>
        <button
          key={id}
          disabled={!moves.addPiece.isAllowed(board, id)}
          onClick={() => moves.addPiece(board, id)}
          className="aspect-square border-r-4 border-b-4 p-[3%]"
        >
          {range(board[id]).map((i) =>
            <span
              key={i}
              className={`
                m-[2%] aspect-square inline-block bg-blue-800 rounded-full
                ${board[id] <= 4 ? 'w-[37%]' : (board[id] <= 6 ? 'w-[28%]' : 'w-[20%]')}
                ${showDimmedDisc && id === firstPlacedSquareIndex && i === board[id] - 1 ? 'opacity-40' : ''}
              `}
            >
            </span>
          )}
      </button>
      )}
    </div>
  </GameBoard>
  );
};

const Rule = () => {
  const { t } = useTranslation('distinct-squares');
  return t('rule.fiveSquares');
};

const StepDescription = ({ ctx }: { ctx: Ctx<TurnState> }) => {
  const { t } = useTranslation('distinct-squares');
  if (ctx.currentPlayer === 1 && ctx.turnState === null) return t('step.fiveSquares.first');
  if (ctx.currentPlayer === 1 && ctx.turnState !== null) return t('step.fiveSquares.second');
  return t('step.fiveSquares.single');
};

export const FiveSquares = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    getPlayerStepDescription: ({ ctx }) => <StepDescription ctx={ctx} />
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: testVariantLabel },
    { botStrategy: smartBotStrategy, generateStartBoard, label: fullVariantLabel, isDefault: true }
  ]
});
