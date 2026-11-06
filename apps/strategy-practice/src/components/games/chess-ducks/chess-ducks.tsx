import { useTranslation } from 'react-i18next';
import { strategyGameFactory, testVariantLabel, type BoardClientProps, GameBoard } from 'strategy-game-factory';
import { range } from 'lodash';
import { DuckSvg } from './rubber-duck-svg';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import {
  DUCK,
  FORBIDDEN,
  moves,
  type Board,
  type Field
} from './gameplay';

const startBoard = (ROWS: number, COLS: number): Board =>
  range(0, ROWS).map(() => range(0, COLS).map(() => null));

// Board-driven: reads its dimensions from the board, so it renders any size.
const BoardClient = ({ board, moves }: BoardClientProps<Board>) => {
  const isForbidden = ({ row, col }: Field) => {
    return board[row][col] === FORBIDDEN;
  };
  const isDuck = ({ row, col }: Field) => {
    return board[row][col] === DUCK;
  };

  return (
    <GameBoard>
      <DuckSvg />
      <table className="w-full border-collapse table-fixed">
        <tbody>
          {range(board.length).map(row => (
            <tr key={row}>
              {range(board[0].length).map(col => (
                <td
                  key={col}
                  className={`
                    border-4
                    ${isForbidden({ row, col }) ? 'bg-slate-900/40 dark:bg-white/20' : ''}
                  `}
                >
                  <button
                    className="w-full aspect-square p-[5%]"
                    disabled={!moves.placeDuck.isAllowed(board, { row, col })}
                    onClick={() => moves.placeDuck(board, { row, col })}
                  >
                    {isDuck({ row, col }) && (
                      <svg className="w-full aspect-square">
                        <use xlinkHref="#game-duck" />
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

const Rule = ({ size }: { size?: { rows: number; cols: number } }) => {
  const { t } = useTranslation('chess-ducks');
  if (!size) return t('rule.generic');
  return t('rule.sized', { rows: size.rows, cols: size.cols });
};

const StepDescription = () => {
  const { t } = useTranslation('chess-ducks');
  return t('step');
};

// Test variant covers both sub-games: a 4 × 6 or a 4 × 7 board.
const testStartBoards: Board[] = [startBoard(4, 6), startBoard(4, 7)];

export const ChessDucks = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    getPlayerStepDescription: () => <StepDescription />
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      id: 'test',
      botStrategy: randomBotStrategy,
      startBoards: testStartBoards,
      label: testVariantLabel
    },
    {
      id: '4x6',
      botStrategy: smartBotStrategy,
      startBoards: [startBoard(4, 6)],
      rule: <Rule size={{ rows: 4, cols: 6 }} />,
      label: t => t('chess-ducks:variant.4x6'),
      isDefault: true
    },
    {
      id: '4x7',
      botStrategy: smartBotStrategy,
      startBoards: [startBoard(4, 7)],
      rule: <Rule size={{ rows: 4, cols: 7 }} />,
      label: t => t('chess-ducks:variant.4x7')
    }
  ]
});
