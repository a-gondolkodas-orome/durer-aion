import { useEffect, useState } from 'react';
import { range } from 'lodash';
import {
  strategyGameFactory,
  type Ctx, type Events, type StrategyArgs, type BoardClientProps,
  GameBoard
} from '../../game-factory';
import { useTranslation } from '../../language';
import {
  type Board,
  applyMove,
  isTerminal,
  getSmartBotMove,
  getRandomBotMove,
  generateStartBoard
} from './helpers';

const Pile = ({ count, index, selected, selectable, onClick }: {
  count: number; index: number; selected: boolean; selectable: boolean; onClick: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <button
      disabled={!selectable}
      onClick={onClick}
      aria-pressed={selected}
      aria-label={t({ hu: `${index + 1}. kupac, ${count} korong`, en: `Pile ${index + 1}, ${count} chips` })}
      className={`
        w-24 sm:w-32 rounded-lg border-2 p-2 flex flex-col items-center gap-2
        ${selected
          ? 'border-blue-500 bg-blue-100 dark:bg-blue-900'
          : 'border-slate-400 bg-surface-elevated enabled:hocus:border-blue-400'}
        disabled:opacity-40
      `}
    >
      {/* rotate(180deg) makes the heap fill from the bottom up, leaving the
          incomplete row on top so it reads as a pile resting on the ground. */}
      <div
        className="flex flex-wrap justify-center content-start gap-1.5 w-full min-h-32"
        style={{ transform: 'rotate(180deg)' }}
      >
        {range(count).map(c => (
          // Counter-rotate each chip so its drop shadow points down (the pile
          // container is flipped 180° to fill from the bottom up).
          <span
            key={c}
            className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-amber-400 dark:bg-amber-500
              border-2 border-amber-600 shadow-md shadow-amber-700/40 rotate-180"
          />
        ))}
      </div>
      <span className="text-2xl font-bold tabular-nums">{count}</span>
    </button>
  );
};

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();
  const [firstSelected, setFirstSelected] = useState<number | null>(null);

  // Reset the in-progress selection whenever the board advances (own or bot move).
  useEffect(() => {
    setFirstSelected(null);
  }, [ctx.moveCount]);

  const clickPile = (i: number) => {
    if (!ctx.isClientMoveAllowed || board[i] === 0) return;
    if (firstSelected === null) {
      setFirstSelected(i);
      return;
    }
    if (firstSelected === i) {
      setFirstSelected(null); // clicking the selected pile again deselects it
      return;
    }
    moves.takeChips(board, firstSelected, i);
  };

  return (
    <GameBoard>
      <div className="flex gap-3 sm:gap-8 justify-center items-end">
        {board.map((count, i) => (
          <Pile
            key={i}
            count={count}
            index={i}
            selected={firstSelected === i}
            selectable={ctx.isClientMoveAllowed && count > 0}
            onClick={() => clickPile(i)}
          />
        ))}
      </div>
      {ctx.isClientMoveAllowed && (
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 h-5">
          {firstSelected === null
            ? t({ hu: 'Válaszd ki az első kupacot.', en: 'Pick the first pile.' })
            : t({ hu: 'Válaszd ki a másik kupacot.', en: 'Pick the other pile.' })}
        </p>
      )}
    </GameBoard>
  );
};

const moves = {
  takeChips: (board: Board, { ctx, events }: { ctx: Ctx, events: Events }, i: number, j: number) => {
    const nextBoard = applyMove(board, [i, j]);
    if (isTerminal(nextBoard)) {
      // The opponent cannot move, so the player who just moved wins.
      events.endGame(ctx.currentPlayer!);
    } else {
      events.endTurn();
    }
    return { nextBoard };
  }
};

const smartBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  const [i, j] = getSmartBotMove(board);
  moves.takeChips(board, i, j);
};

const randomBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  const [i, j] = getRandomBotMove(board);
  moves.takeChips(board, i, j);
};

const rule = {
  hu: <>
    Három kupacban összesen legfeljebb 20, de páros számú korong van. A két játékos felváltva lép:
    a soron következő játékos kiválaszt két nem üres kupacot, és mindkettőből elvesz egy-egy
    korongot. Az a játékos veszít, aki nem tud lépni.
  </>,
  en: <>
    There are chips in three piles — an even number in total, at most 20. The two players move
    alternately: on their turn, the current player picks two non-empty piles and removes one chip
    from each. The player who cannot move loses.
  </>
};

export const TwoOfThreeTakeaway = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription: () => ({
      hu: 'Válassz két nem üres kupacot – mindkettőből elveszel egy-egy korongot.',
      en: 'Choose two non-empty piles — you remove one chip from each.'
    })
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      generateStartBoard,
      label: { hu: 'Teszt 🤖', en: 'Test 🤖' }
    },
    // smart bot: verified as optimal (see helpers.spec.ts exhaustive minimax check)
    {
      botStrategy: smartBotStrategy,
      generateStartBoard,
      label: { hu: 'Okos 🤖', en: 'Smart 🤖' },
      isDefault: true
    }
  ]
});
