import { useState } from 'react';
import { range } from 'lodash';
import {
  strategyGameFactory, type BoardClientProps, type Events, type Ctx, GameBoard
} from '../../game-factory';
import { useTranslation } from '../../language';
import {
  type Board, type Orientation, type Move,
  getRectangleAt, applyMove, isEmpty, generateStartBoard
} from './helpers';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';

type Selected = { r: number; c: number } | null

const BoardClient = ({ board, ctx, events, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();
  const { grid } = board;
  const selected = ctx.turnState as Selected;
  const [hoverOrientation, setHoverOrientation] = useState<Orientation | null>(null);
  const rect = selected ? getRectangleAt(grid, selected.r, selected.c) : null;

  const clickDisc = (r: number, c: number) => {
    if (!ctx.isClientMoveAllowed) return;
    setHoverOrientation(null);
    events.setTurnState(selected && selected.r === r && selected.c === c ? null : { r, c });
  };

  const removeLine = (orientation: Orientation) => {
    if (!ctx.isClientMoveAllowed || !selected) return;
    setHoverOrientation(null);
    moves.removeLine(board, { ...selected, orientation });
  };

  const discClass = (r: number, c: number) => {
    if (!rect || !selected) return 'bg-blue-500';
    const inRect = r >= rect.minR && r <= rect.maxR && c >= rect.minC && c <= rect.maxC;
    if (!inRect) return 'bg-blue-500';
    const sameRow = r === selected.r;
    const sameCol = c === selected.c;
    // Only the removable lines through the selected disc: its row and its column
    // within the same rectangle.
    if ((hoverOrientation === 'row' && sameRow) || (hoverOrientation === 'col' && sameCol)) {
      return 'bg-slate-500';
    }
    if (sameRow || sameCol) return 'bg-blue-500 ring-2 ring-amber-400';
    return 'bg-blue-500';
  };

  const isSelected = (r: number, c: number) => !!selected && selected.r === r && selected.c === c;

  return (
    <GameBoard>
      <div className="flex justify-center py-2">
        <table className="border-collapse">
          <tbody>
            {range(grid.length).map(r => (
              <tr key={r}>
                {range(grid[0].length).map(c => (
                  <td key={c} className="border border-slate-300 dark:border-slate-600 p-0">
                    <button
                      aria-label={t({
                        hu: `korong ${r + 1}. sor ${c + 1}. oszlop`,
                        en: `disc row ${r + 1} column ${c + 1}`
                      })}
                      className="size-9 sm:size-11 flex items-center justify-center"
                      disabled={!ctx.isClientMoveAllowed || !grid[r][c]}
                      onClick={() => clickDisc(r, c)}
                    >
                      {grid[r][c] && (
                        <span
                          className={`size-7 sm:size-9 rounded-full transition-colors ${discClass(r, c)} ${
                            isSelected(r, c) ? 'ring-4 ring-amber-500' : ''
                          }`}
                        />
                      )}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && rect && ctx.isClientMoveAllowed && (
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          {[
            {
              orientation: 'row' as const,
              count: rect.maxC - rect.minC + 1,
              label: { hu: 'Sor levétele', en: 'Remove row' }
            },
            {
              orientation: 'col' as const,
              count: rect.maxR - rect.minR + 1,
              label: { hu: 'Oszlop levétele', en: 'Remove column' }
            }
          ].map(({ orientation, count, label }) => (
            <button
              key={orientation}
              className="primary-button w-auto grow"
              onClick={() => removeLine(orientation)}
              onPointerEnter={() => setHoverOrientation(orientation)}
              onPointerLeave={() => setHoverOrientation(null)}
              onFocus={() => setHoverOrientation(orientation)}
              onBlur={() => setHoverOrientation(null)}
            >
              {t(label)} ({count})
            </button>
          ))}
        </div>
      )}
    </GameBoard>
  );
};

const moves = {
  removeLine: (board: Board, { events }: { events: Events }, move: Move) => {
    const nextBoard = { grid: applyMove(board.grid, move) };
    events.setTurnState(null);
    events.endTurn();
    // Whoever removes the last disc wins; endGame() defaults the winner to the
    // player who just moved (currentPlayer at move time).
    if (isEmpty(nextBoard.grid)) {
      events.endGame();
    }
    return { nextBoard };
  }
};

const rule = {
  hu: <>
    A játék kezdetén egy n × k-as téglalap minden mezőjére teszünk egy-egy korongot. A két játékos
    felváltva lép. Egy lépésben a soron lévő játékos kiválaszt egy korongokból álló téglalapot, és
    egy sorának vagy oszlopának minden korongját leveszi. (Korongokból álló téglalapnak egy olyan
    téglalap alakú területet nevezünk, ahol minden mezőn van korong, de közvetlenül mellette sehol.
    Kezdetben csak egy ilyen téglalap van, később már lehet, hogy több is.) Az nyer, aki az utolsó
    korongot elveszi.
  </>,
  en: <>
    At the start, a disc is placed on every cell of an n × k rectangle. The two players move
    alternately. On a turn, the current player picks a solid rectangle of discs and removes every
    disc in one of its rows or one of its columns. (A rectangle of discs is a rectangular block where
    every cell has a disc and no cell directly next to it does. At the start there is only one such
    rectangle; later there may be several.) Whoever removes the last disc wins.
  </>
};

const getPlayerStepDescription = ({ ctx }: { board: Board; ctx: Ctx }) => {
  return ctx.turnState
    ? {
      hu: 'Vedd le a kijelölt korong sorát vagy oszlopát a gombokkal, vagy válassz másik korongot.',
      en: 'Remove the selected disc’s row or column with the buttons, or pick another disc.'
    }
    : {
      hu: 'Kattints egy korongra, majd válaszd a sorának vagy oszlopának levételét.',
      en: 'Click a disc, then choose to remove its row or its column.'
    };
};

export const RemoveRowOrColumn = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt 🤖', en: 'Test 🤖' } },
    // smart bot: optimal (Sprague–Grundy; moves to a zero position when winning)
    {
      botStrategy: smartBotStrategy,
      generateStartBoard,
      label: { hu: 'Okos 🤖', en: 'Smart 🤖' },
      isDefault: true
    }
  ]
});
