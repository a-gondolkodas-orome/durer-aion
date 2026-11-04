import { range } from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import {
  strategyGameFactory, testVariantLabel, fullVariantLabel, GameBoard, type BoardClientProps, type StrategyArgs
} from 'strategy-game-factory';
import { generateEmptyTicTacToeBoard } from '../gameplay';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { inPlacingPhase, moves, otherPlayerColor, type Board } from './gameplay';

const BoardClient = ({ board, moves }: BoardClientProps<Board>) => {
  const gameIsInPlacingPhase = inPlacingPhase(board);
  const clickField = (id: number) => {
    if (gameIsInPlacingPhase) {
      moves.placePiece(board, id);
    } else {
      moves.whitenPiece(board, id);
    }
  };
  const isMoveAllowed = (id: number) => gameIsInPlacingPhase
    ? moves.placePiece.isAllowed(board, id)
    : moves.whitenPiece.isAllowed(board, id);
  const pieceColor = (id: number) => {
    const colorCode = board[id];
    if (colorCode === 'red') return 'bg-red-800';
    if (colorCode === 'white') return 'bg-slate-50 dark:bg-slate-600';
    return 'bg-blue-800';
  };

  // The grid gap is the border: the container colour shows through it, so every
  // cell needs its own background or the gaps disappear into it.
  return (
  <GameBoard>
    <div className="grid grid-cols-3 bg-slate-200 dark:bg-slate-600 gap-1 p-1">
      {range(9).map(id => (
        <button
          key={id}
          disabled={!isMoveAllowed(id)}
          onClick={() => clickField(id)}
          className="aspect-square p-[25%] bg-surface-elevated"
        >
          {board[id] && (
            <span
              className={`
                w-full aspect-square block rounded-full
                ${!gameIsInPlacingPhase && isMoveAllowed(id) ? 'hocus:opacity-50' : ''}
                ${pieceColor(id)}
                ${board[id] === 'white' ? 'border-4 border-slate-900 dark:border-slate-300' : ''}
              `}
            ></span>
          )}
      </button>
      ))}
    </div>
  </GameBoard>
  );
};

const StepDescription = ({ board, ctx }: Pick<StrategyArgs<Board>, 'board' | 'ctx'>) => {
  const { t } = useTranslation('tictactoe-alikes');
  if (inPlacingPhase(board)) return t('ticTacToe.step.place');
  return otherPlayerColor(ctx) === 'red' ? t('ticTacToe.step.whitenRed') : t('ticTacToe.step.whitenBlue');
};

const Rule = () => {
  const { t } = useTranslation('tictactoe-alikes');
  return <Trans t={t} i18nKey="ticTacToe.rule" />;
};

export const TicTacToe = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    getPlayerStepDescription: ({ board, ctx }) => <StepDescription board={board} ctx={ctx} />
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: testVariantLabel },
    {
      botStrategy: smartBotStrategy,
      startBoards: [generateEmptyTicTacToeBoard()],
      label: fullVariantLabel,
      isDefault: true
    }
  ]
});
