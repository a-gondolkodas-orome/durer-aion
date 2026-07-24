import { strategyGameFactory, type BoardClientProps, GameBoard } from '../../strategy-game-factory';
import { some, range, isEqual, sample } from 'lodash';
import { DuckSvg } from './rubber-duck-svg';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import {
  getAllowedMoves,
  DUCK,
  FORBIDDEN,
  moves,
  type Board,
  type Field
} from './helpers';

const generateStartBoard = (ROWS: number, COLS: number) => (): Board => {
  return range(0, ROWS).map(() => range(0, COLS).map(() => null));
};

// Board-driven: reads its dimensions from the board, so it renders any size.
const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const clickField = (field: Field) => {
    if (!isMoveAllowed(field)) return;

    moves.placeDuck(board, field);
  };

  const isMoveAllowed = (targetField: Field) => {
    if (!ctx.isClientMoveAllowed) return false;
    return some(getAllowedMoves(board), field => isEqual(field, targetField));
  };

  const isForbidden = ({ row, col }: Field) => {
    return board[row][col] === FORBIDDEN;
  };
  const isDuck = ({ row, col }: Field) => {
    return board[row][col] === DUCK;
  };

  return(
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
                    disabled={!isMoveAllowed({ row, col })}
                    onClick={() => clickField({ row, col })}
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

const toldalek: Record<number, string> = {
  6: 'o',
  7: 'e'
};

const rule = (ROWS: number, COLS: number) => ({
  hu: <>
    Azt sokan tudják, hogy egy ló hogy lép a sakktáblán, de azt már nagyon kevesen, hogy
    egy kacsa hogyan: a négy oldalszomszédos mezőre tud lépni. A két játékos felváltva rak le
    a {ROWS} × {COLS}-{toldalek[COLS]}s táblára kacsákat úgy, hogy a lerakott bábu ne üsse
    a táblán levő kacsák egyikét sem. Az veszít, aki nem tud lépni.
  </>,
  en: <>
    Many people know how a knight moves in chess, but very few know how a duck moves: it can step
    to any of its four orthogonal neighbours. Two players take turns placing ducks on the {ROWS} × {COLS} board
    so that the newly placed piece does not attack any duck already on the board. The player who
    cannot place a duck loses.
  </>
});

const genericRule = {
  hu: <>
    Azt sokan tudják, hogy egy ló hogy lép a sakktáblán, de azt már nagyon kevesen, hogy
    egy kacsa hogyan: a négy oldalszomszédos mezőre tud lépni. A két játékos felváltva rak le
    a táblára kacsákat úgy, hogy a lerakott bábu ne üsse a táblán levő kacsák egyikét sem.
    Az veszít, aki nem tud lépni.
  </>,
  en: <>
    Many people know how a knight moves in chess, but very few know how a duck moves: it can step
    to any of its four orthogonal neighbours. Two players take turns placing ducks on the board
    so that the newly placed piece does not attack any duck already on the board. The player who
    cannot place a duck loses.
  </>
};

const getPlayerStepDescription = () => ({
  hu: 'Kattints egy mezőre, amit nem üt egyik kacsa sem.',
  en: 'Click on a square that is not attacked by any duck.'
});

// Test variant covers both sub-games: a 4 × 6 or a 4 × 7 board.
const generateTestStartBoard = (): Board =>
  sample([generateStartBoard(4, 6), generateStartBoard(4, 7)])!();

export const ChessDucks = strategyGameFactory({
  presentation: {
    rule: genericRule,
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      generateStartBoard: generateTestStartBoard,
      label: { hu: 'Teszt', en: 'Test' }
    },
    // smart bot: verified as optimal
    {
      botStrategy: smartBotStrategy,
      generateStartBoard: generateStartBoard(4, 6),
      rule: rule(4, 6),
      label: { hu: '4×6', en: '4×6' },
      isDefault: true
    },
    {
      botStrategy: smartBotStrategy,
      generateStartBoard: generateStartBoard(4, 7),
      rule: rule(4, 7),
      label: { hu: '4×7', en: '4×7' }
    }
  ]
});
