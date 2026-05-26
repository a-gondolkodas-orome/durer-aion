import { strategyGameFactory, type BoardClientProps, GameBoard } from '../../game-factory';
import { some, range, isEqual } from 'lodash';
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

const chessDucksGameFactory = ({ ROWS, COLS }: { ROWS: number; COLS: number }) => {
  const generateStartBoard = (): Board => {
    return range(0, ROWS).map(() => range(0, COLS).map(() => null));
  };

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
          {range(ROWS).map(row => (
            <tr key={row}>
              {range(COLS).map(col => (
                <td
                  key={col}
                  onClick={() => clickField({ row, col })}
                  className={`
                    border-4
                    ${isForbidden({ row, col }) ? 'bg-slate-400 cursor-not-allowed' : ''}
                  `}
                >
                  <button
                    className="aspect-square w-full h-full p-[5%]"
                    disabled={!isMoveAllowed({ row, col })}
                  >
                    {isDuck({ row, col }) && (
                      <span>
                        <svg className="inline-block aspect-square">
                          <use xlinkHref="#game-duck" />
                        </svg>
                      </span>
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

  const toldalek = {
    '6': 'o',
    '7': 'e'
  };

  const rule = {
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
  };

  return strategyGameFactory({
    presentation: {
      rule,
      getPlayerStepDescription: () => ({
        hu: 'Kattints egy mezőre, amit nem üt egyik kacsa sem.',
        en: 'Click on a square that is not attacked by any duck.'
      })
    },
    BoardClient,
    gameplay: { moves },
    variants: [
      { botStrategy: randomBotStrategy, label: { hu: 'Teszt 🤖', en: 'Test 🤖' } },
      { botStrategy: smartBotStrategy, generateStartBoard, label: { hu: 'Okos 🤖', en: 'Smart 🤖' }, isDefault: true }
    ]
  });
};

export const ChessDucksC = chessDucksGameFactory({ ROWS: 4, COLS: 6 });
export const ChessDucksE = chessDucksGameFactory({ ROWS: 4, COLS: 7 });
