import { Trans, useTranslation } from 'react-i18next';
import {
  strategyGameFactory, testVariantLabel, fullVariantLabel, type BoardClientProps, type Ctx, GameBoard
} from 'strategy-game-factory';
import { range } from 'lodash';
import { ChessBishopSvg } from '../chess-bishops/chess-bishop-svg';
import { startBoard, moves, type Board } from './gameplay';
import { optimalBotStrategy, randomBotStrategy } from './bot-strategy';

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const potentialStep = (i: number) => {
    return ctx.currentPlayer === 0 ? i - board.left : board.right - i;
  }

  const cellBackground = (i: number) => {
    if (i === board.left) return 'bg-green-400';
    if (i === board.right) return 'bg-purple-400';
    if (moves.step.isAllowed(board, potentialStep(i))) {
      return ctx.currentPlayer === 0
        ? 'bg-green-200 dark:bg-green-700 enabled:hocus:bg-green-400 dark:enabled:hocus:bg-green-600'
        : 'bg-purple-200 dark:bg-purple-700 enabled:hocus:bg-purple-400 dark:enabled:hocus:bg-purple-600';
    }
    return 'bg-slate-200 dark:bg-slate-700';
  };

  return (
  <GameBoard>
    <ChessBishopSvg/>
    <div className="grid grid-cols-12 gap-1">
        {range(1, 13).map(i =>
          <button
            key={i}
            className={`
              w-full aspect-square text-xl font-bold rounded-sm drop-shadow-sm p-[10%]
              ${cellBackground(i)}
            `}
            disabled={!moves.step.isAllowed(board, potentialStep(i))}
            onClick={() => moves.step(board, potentialStep(i))}
          >{ i === board.left || i === board.right
            ? <svg className="w-full aspect-square">
                <use href="#game-chess-bishop" />
              </svg>
            : i }
          </button>
        )}
    </div>
  </GameBoard>
  );
};

const Rule = () => {
  const { t } = useTranslation('twelve-squares');
  return <Trans t={t} i18nKey="rule" />;
};

const StepDescription = ({ ctx }: { ctx: Ctx }) => {
  const { t } = useTranslation('twelve-squares');
  return ctx.currentPlayer === 0 ? t('step.left') : t('step.right');
};

export const TwelveSquares = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    getPlayerStepDescription: ({ ctx }) => <StepDescription ctx={ctx} />
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: testVariantLabel },
    {
      botStrategy: optimalBotStrategy,
      startBoards: [startBoard],
      label: fullVariantLabel,
      isDefault: true
    }
  ]
});
