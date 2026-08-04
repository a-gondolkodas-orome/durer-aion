import { useEffect, useState } from 'react';
import {
  strategyGameFactory,
  type BoardClientProps,
  type Ctx,
  type BotStrategy,
  GameBoard
} from '../../strategy-game-factory';
import { useTranslation } from '../../../language';
import { generateStartBoard, getRandomBotStep, getSmartBotStep, moves, type Board, type Moves } from './gameplay';

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();
  const [selectedCell, setSelectedCell] = useState<number | null>(null);

  // Clear the pending selection whenever the board advances (own or bot move).
  useEffect(() => {
    setSelectedCell(null);
  }, [ctx.moveCount]);

  const clickCell = (cell: number) => {
    if (!ctx.isClientMoveAllowed || board[cell] !== 0) return;
    setSelectedCell(prev => (prev === cell ? null : cell));
  };

  const placeDigit = (digit: number) => moves.placeDigit(board, selectedCell, digit);

  // Which digits the selected cell will accept — asked of the move itself, so
  // the keypad and the engine cannot disagree.
  const allowed = [1, 2, 3].filter(
    digit => selectedCell !== null && moves.placeDigit.isAllowed(board, selectedCell, digit)
  );

  return (
    <GameBoard>
      <div
        className="grid grid-cols-3 bg-slate-300 dark:bg-slate-600 gap-1 p-1 max-w-xs mx-auto"
        onKeyDown={e => {
          if (['1', '2', '3'].includes(e.key) && allowed.includes(Number(e.key))) {
            placeDigit(Number(e.key));
          }
        }}
      >
        {board.map((value, cell) => {
          const isEmpty = value === 0;
          const isSelected = selectedCell === cell;
          return (
            <button
              key={cell}
              disabled={!ctx.isClientMoveAllowed || !isEmpty}
              onClick={() => clickCell(cell)}
              aria-label={
                isEmpty
                  ? t({ hu: `üres mező`, en: `empty cell` })
                  : t({ hu: `${value} számjegy`, en: `digit ${value}` })
              }
              className={`
                aspect-square flex items-center justify-center text-4xl sm:text-5xl font-bold tabular-nums
                ${isSelected
                  ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500 ring-inset'
                  : 'bg-surface-elevated'}
                ${isEmpty
                  ? 'enabled:hocus:bg-blue-50 dark:enabled:hocus:bg-blue-950'
                  : 'text-slate-700 dark:text-slate-200'}
              `}
            >
              {isEmpty ? '' : value}
            </button>
          );
        })}
      </div>

      {ctx.isClientMoveAllowed && selectedCell !== null && (
        <div className="mt-4 flex flex-col items-center gap-2">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {allowed.length > 0
              ? t({ hu: 'Melyik számjegyet írod be?', en: 'Which digit do you write?' })
              : t({
                hu: 'Ide egyik számjegy sem írható — válassz másik mezőt.',
                en: 'No digit fits here — pick another cell.'
              })}
          </p>
          <div className="flex gap-2">
            {[1, 2, 3].map(digit => (
              <button
                key={digit}
                disabled={!allowed.includes(digit)}
                onClick={() => placeDigit(digit)}
                className="w-14 h-14 rounded-lg border-2 text-2xl font-bold tabular-nums
                  enabled:hocus:bg-blue-100 dark:enabled:hocus:bg-blue-900
                  enabled:hocus:border-blue-400 border-slate-400 disabled:opacity-30"
              >
                {digit}
              </button>
            ))}
          </div>
        </div>
      )}
    </GameBoard>
  );
};

type Bot = BotStrategy<Board, Moves>

const smartBotStrategy: Bot = ({ board }) => {
  const { cell, digit } = getSmartBotStep(board);
  return { move: 'placeDigit', args: [cell, digit] };
};

const randomBotStrategy: Bot = ({ board }) => {
  const { cell, digit } = getRandomBotStep(board);
  return { move: 'placeDigit', args: [cell, digit] };
};

const getPlayerStepDescription = ({ ctx }: { board: Board; ctx: Ctx }) => {
  const goal = ctx.currentPlayer === 0
    ? {
      hu: ' A célod, hogy végül mind a 9 mező megteljen.',
      en: ' Your goal is to fill all 9 cells.'
    }
    : {
      hu: ' A célod, hogy a másik játékos elakadjon: legyen üres mező, de már ne tudjon szabályosan lépni.',
      en: ' Your goal is to get the other player stuck: an empty cell remains but no legal move is left.'
    };
  return {
    hu: `Kattints egy üres mezőre, majd írj bele egy 1-es, 2-es vagy 3-as számjegyet.${goal.hu}`,
    en: `Click an empty cell, then write a 1, 2, or 3 into it.${goal.en}`
  };
};

const rule = {
  hu: <>
    Adott egy 3×3-as táblázat. Egy lépésben a soron következő játékos beír egy üres mezőbe egy
    1-es, 2-es vagy 3-as számjegyet úgy, hogy ne keletkezzen olyan sor vagy oszlop, amiben van
    két azonos szám. A kezdő játékos akkor nyer, ha mind a 9 mezőbe kerül szám, míg a második akkor
    nyer, ha valakinek a köre előtt még van üres mező, de már nem tud szabályosan lépni.
  </>,
  en: <>
    You are given a 3×3 grid. On their turn, the current player writes a 1, 2, or 3 into an empty
    cell, so that no row or column ends up containing two equal numbers. The first player wins if
    all 9 cells get filled; the second player wins if, before someone's turn, there is still an
    empty cell but no legal move is possible.
  </>
};

export const LatinSquareFilling = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      generateStartBoard,
      label: { hu: 'Teszt', en: 'Test' }
    },
    // smart bot: exhaustive minimax, verified optimal (see helpers.spec.ts)
    {
      botStrategy: smartBotStrategy,
      generateStartBoard,
      label: { hu: 'Teljes', en: 'Full' },
      isDefault: true
    }
  ]
});
