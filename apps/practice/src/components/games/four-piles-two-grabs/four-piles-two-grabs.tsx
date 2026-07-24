import { useEffect, useState } from 'react';
import { range } from 'lodash';
import {
  strategyGameFactory,
  type Ctx, type Events, type StrategyArgs, type BoardClientProps,
  GameBoard
} from '../../strategy-game-factory';
import { useTranslation } from '../../../language';
import {
  type Board,
  type Move,
  applyMove,
  isTerminal,
  getSmartBotMove,
  getRandomBotMove,
  generateStartBoard
} from './helpers';

const Stepper = ({ label, disabled, onClick }: {
  label: string; disabled: boolean; onClick: () => void;
}) => (
  <button
    disabled={disabled}
    onClick={onClick}
    aria-label={label}
    className="w-8 h-8 rounded-full border-2 border-slate-400 bg-surface-elevated
      text-lg font-bold leading-none enabled:hocus:border-blue-400 disabled:opacity-30"
  >
    {label.slice(0, 1)}
  </button>
);

const Pile = ({ count, index, removeCount, canAdd, disabled, onInc, onDec }: {
  count: number; index: number; removeCount: number;
  canAdd: boolean; disabled: boolean; onInc: () => void; onDec: () => void;
}) => {
  const { t } = useTranslation();
  const selected = removeCount > 0;
  return (
    <div
      className={`
        w-20 sm:w-28 rounded-lg border-2 p-2 flex flex-col items-center gap-2
        ${selected
          ? 'border-blue-500 bg-blue-100 dark:bg-blue-900'
          : 'border-slate-400 bg-surface-elevated'}
      `}
    >
      {/* rotate(180deg) makes the heap fill from the bottom up, leaving the
          incomplete row on top so it reads as a pile resting on the ground. */}
      <div
        className="flex flex-wrap justify-center content-start gap-1.5 w-full min-h-28"
        style={{ transform: 'rotate(180deg)' }}
      >
        {range(count).map(c => {
          // The top `removeCount` stones (highest indices in the flipped
          // container) are the ones marked for removal.
          const removed = c >= count - removeCount;
          return (
            <span
              key={c}
              className={`w-4 h-4 sm:w-6 sm:h-6 rounded-full rotate-180
                ${removed
                  ? 'bg-slate-500 dark:bg-slate-400'
                  : 'bg-amber-500'}`}
            />
          );
        })}
      </div>
      <span className="text-xl font-bold tabular-nums">
        {removeCount > 0 ? `−${removeCount} (${count - removeCount})` : count}
      </span>
      <div className="flex items-center gap-2">
        <Stepper
          label={t({ hu: `−1 a(z) ${index + 1}. kupacból`, en: `−1 from pile ${index + 1}` })}
          disabled={disabled || removeCount === 0}
          onClick={onDec}
        />
        <Stepper
          label={t({ hu: `+1 a(z) ${index + 1}. kupacból`, en: `+1 from pile ${index + 1}` })}
          disabled={disabled || removeCount >= count || (removeCount === 0 && !canAdd)}
          onClick={onInc}
        />
      </div>
    </div>
  );
};

const emptyRemovals: Move = [0, 0, 0, 0];

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();
  const [removals, setRemovals] = useState<Move>(emptyRemovals);

  // Reset the in-progress selection whenever the board advances (own or bot move).
  useEffect(() => {
    setRemovals(emptyRemovals);
  }, [ctx.moveCount]);

  const activeCount = removals.filter(r => r > 0).length;
  const readyToMove = activeCount === 2;

  const adjust = (i: number, delta: number) => {
    if (!ctx.isClientMoveAllowed) return;
    setRemovals(prev => prev.map((r, idx) => (idx === i ? r + delta : r)));
  };

  const submit = () => {
    if (!ctx.isClientMoveAllowed || !readyToMove) return;
    moves.takeStones(board, removals);
  };

  return (
    <GameBoard>
      <div className="flex gap-2 sm:gap-6 justify-center items-end">
        {board.map((count, i) => (
          <Pile
            key={i}
            count={count}
            index={i}
            removeCount={removals[i]}
            canAdd={activeCount < 2}
            disabled={!ctx.isClientMoveAllowed || count === 0}
            onInc={() => adjust(i, 1)}
            onDec={() => adjust(i, -1)}
          />
        ))}
      </div>
      {ctx.isClientMoveAllowed && (
        <div className="mt-4 flex flex-col items-center gap-2">
          <button
            disabled={!readyToMove}
            onClick={submit}
            className="primary-button w-auto"
          >
            {t({ hu: 'Elveszem a kavicsokat', en: 'Remove the stones' })}
          </button>
        </div>
      )}
    </GameBoard>
  );
};

const moves = {
  takeStones: (board: Board, { ctx, events }: { ctx: Ctx, events: Events }, move: Move) => {
    const nextBoard = applyMove(board, move);
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
  moves.takeStones(board, getSmartBotMove(board));
};

const randomBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  moves.takeStones(board, getRandomBotMove(board));
};

const rule = {
  hu: <>
    Négy kupacban vannak kavicsok. A két játékos felváltva lép: a soron következő játékos kiválaszt
    két nem üres kupacot, és mindegyikből elvesz néhány kavicsot (mindkettőből legalább egyet; a két
    kupacból elvett mennyiség lehet különböző). Az a játékos veszít, aki nem tud lépni – vagyis az
    nyer, akinek a lépése után már legfeljebb egy kupacban marad kavics.
  </>,
  en: <>
    There are stones in four piles. The two players move alternately: on their turn, the current
    player picks two non-empty piles and removes some stones from each (at least one from each; the
    amounts removed from the two piles may differ). The player who cannot move loses — that is, the
    player who leaves at most one non-empty pile wins.
  </>
};

export const FourPilesTwoGrabs = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription: () => ({
      hu: 'Válassz két nem üres kupacot, és állítsd be, hány kavicsot veszel el belőlük.',
      en: 'Choose two non-empty piles and set how many stones you take from each.'
    })
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      generateStartBoard,
      label: { hu: 'Teszt', en: 'Test' }
    },
    // smart bot: verified as optimal (see helpers.spec.ts exhaustive minimax check)
    {
      botStrategy: smartBotStrategy,
      generateStartBoard,
      label: { hu: 'Teljes', en: 'Full' },
      isDefault: true
    }
  ]
});
