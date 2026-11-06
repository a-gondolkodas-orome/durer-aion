import { Trans, useTranslation } from 'react-i18next';
import { range } from 'lodash';
import {
  strategyGameFactory, testVariantLabel, fullVariantLabel, type BoardClientProps, GameBoard
} from 'strategy-game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { startBoard, moves, type Board, type Field } from './gameplay';
import { RookSvg } from '../shared/rook-svg';

const BoardClient = ({ board, moves }: BoardClientProps<Board>) => {
  const isMoveAllowed = (targetField: Field) => moves.moveRook.isAllowed(board, targetField);

  return (
  <GameBoard>
    <RookSvg id="game-chess-rook" />
    <table className="border-collapse w-full table-fixed">
      <tbody>
        {range(8).map(row => (
          <tr key={row}>
            {range(8).map(col => (
              <td
                key={col}
                className={`border-4 ${
                  board.chessBoard[row][col] === 'visited' ? 'bg-slate-900/40 dark:bg-white/20' : ''
                }`}
              >
                <button
                  className="w-full aspect-square p-[5%]"
                  disabled={!isMoveAllowed({ row, col })}
                  onClick={() => moves.moveRook(board, { row, col })}
                >
                  {isMoveAllowed({ row, col }) && (
                    <svg className="w-full aspect-square opacity-20">
                      <use xlinkHref="#game-chess-rook" />
                    </svg>
                  )}
                  {board.chessBoard[row][col] === 'rook' && (
                    <svg className="w-full aspect-square">
                      <use xlinkHref="#game-chess-rook" />
                    </svg>
                  )}
                </button>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </GameBoard>
  );
};

const Rule = () => {
  const { t } = useTranslation('chess-rook');
  return <Trans t={t} i18nKey="rule" />;
};

const StepDescription = () => {
  const { t } = useTranslation('chess-rook');
  return t('step');
};

export const ChessRook = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    getPlayerStepDescription: () => <StepDescription />
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: testVariantLabel },
    { botStrategy: smartBotStrategy, startBoards: [startBoard], label: fullVariantLabel, isDefault: true }
  ]
});
