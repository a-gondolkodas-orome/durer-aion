import { range } from 'lodash';
import { strategyGameFactory, type BoardClientProps, GameBoard } from 'strategy-game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { generateStartBoard, moves, type Board, type Field } from './gameplay';
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

const rule = {
  hu: <>
    A játékosok felváltva lépnek egy bástyával, amely a sakktábla bal felső sarkából indul. A
    bástya vízszintesen vagy függőlegesen bármennyit (legalább egyet) léphet, de egyszerre csak az
    egyik irányba. Azokat a mezőket, amikre a bástya lép, illetve a lépés közben áthalad, megjelöljük,
    ezekre a mezőkre már nem léphetünk később (át sem haladhatunk felettük). Az a játékos veszít, aki
    nem tud lépni.
  </>,
  en: <>
    Players take turns moving a rook that starts in the top-left corner of a chessboard. The rook
    may move any number of squares (at least one) horizontally or vertically, but only in one
    direction per move. Every square the rook lands on or passes through is marked and can no longer
    be entered or passed through later. The player who cannot move loses.
  </>
};

export const ChessRook = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription: () => ({
      hu: 'Kattints egy szabad mezőre a bástyával egy sorban vagy oszlopban.',
      en: 'Click on a free square in the same row or column as the rook.'
    })
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt', en: 'Test' } },
    { botStrategy: smartBotStrategy, generateStartBoard, label: { hu: 'Teljes', en: 'Full' }, isDefault: true }
  ]
});
