import { sample } from 'lodash';
import {
  strategyGameFactory, type Events, type StrategyArgs, type BoardClientProps, GameBoard
} from '../../game-factory';
import { useTranslation } from '../../language';

type Board = { digits: number[], sumMod9: number }

const totalDigits = 10;
const availableDigits = [1, 2, 3, 4, 5, 6];

// Precompute winner(sumMod9, turnsLeft): 0 = Jenő wins, 1 = Béla wins, with optimal play.
// Jenő is player 0 (first mover), Béla is player 1.
// Béla wins iff the final digit sum ≡ 0 (mod 9).
const winnerFromState = (() => {
  const memo = {};
  const compute = (sumMod9, turnsLeft) => {
    const key = `${sumMod9},${turnsLeft}`;
    if (key in memo) return memo[key];
    if (turnsLeft === 0) return (memo[key] = sumMod9 === 0 ? 1 : 0);
    const currentPlayer = (totalDigits - turnsLeft) % 2;
    for (const d of availableDigits) {
      if (compute((sumMod9 + d) % 9, turnsLeft - 1) === currentPlayer) {
        return (memo[key] = currentPlayer);
      }
    }
    return (memo[key] = 1 - currentPlayer);
  };
  for (let t = 0; t <= totalDigits; t++) for (let s = 0; s < 9; s++) compute(s, t);
  return (sumMod9, turnsLeft) => memo[`${sumMod9},${turnsLeft}`];
})();

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();
  const slots = Array.from({ length: totalDigits }, (_, i) =>
    i < board.digits.length ? board.digits[i] : null
  );

  let numberSummary: string | null = null;
  if (board.digits.length === totalDigits) {
    const num = board.digits.reduce((acc, d) => acc * 10 + d, 0);
    const remainder = board.sumMod9;
    const quotient = (num - remainder) / 9;
    const fmt = (n: number) => n.toLocaleString();
    const expr = remainder === 0
      ? `${fmt(num)} = ${fmt(quotient)} · 9`
      : `${fmt(num)} = ${fmt(quotient)} · 9 + ${remainder}`;
    numberSummary = t({ hu: `A szám: ${expr}`, en: `The number: ${expr}` });
  }

  return (
    <GameBoard>
      <div className="flex gap-1 mb-2 flex-wrap">
        {slots.map((d, i) => {
          const isNextSlot = d === null && i === board.digits.length && ctx.phase === 'play';
          const slotClass = isNextSlot
            ? 'border-blue-400 bg-blue-50 text-blue-400'
            : `border-slate-600 ${d === null ? 'opacity-50' : ''}`;
          return (
            <div
              key={i}
              className={`border-2 w-10 py-2 rounded-sm text-center text-2xl ${slotClass}`}
            >
              {d ?? '?'}
            </div>
          );
        })}
      </div>
      {numberSummary && <p className="text-sm mb-2">{numberSummary}</p>}
      <div className="mt-6 pt-4 border-t flex gap-2 flex-wrap">
        {availableDigits.map(d => (
          <button
            key={d}
            disabled={!ctx.isClientMoveAllowed}
            onClick={(e) => { moves.chooseDigit(board, d); e.currentTarget.blur(); }}
            className="rounded-lg border-2 text-2xl w-12 py-2 font-bold
              enabled:hocus:bg-blue-100 enabled:hocus:border-blue-300 disabled:opacity-50"
          >
            {d}
          </button>
        ))}
      </div>
    </GameBoard>
  );
};

const moves = {
  chooseDigit: (board: Board, { events }: { events: Events }, digit) => {
    const newDigits = [...board.digits, digit];
    const newSumMod9 = (board.sumMod9 + digit) % 9;
    const nextBoard = { digits: newDigits, sumMod9: newSumMod9 };
    if (newDigits.length === totalDigits) {
      events.endGame(newSumMod9 === 0 ? 1 : 0);
    } else {
      events.endTurn();
    }
    return { nextBoard };
  }
};

const randomBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  const turnsLeft = totalDigits - board.digits.length;
  const currentPlayer = (totalDigits - turnsLeft) % 2;

  if (turnsLeft === 1) {
    const winningDigits = availableDigits.filter(
      d => winnerFromState((board.sumMod9 + d) % 9, 0) === currentPlayer
    );
    moves.chooseDigit(board, sample(winningDigits.length > 0 ? winningDigits : availableDigits));
    return;
  }

  moves.chooseDigit(board, sample(availableDigits));
};

const smartBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  const turnsLeft = totalDigits - board.digits.length;
  const currentPlayer = (totalDigits - turnsLeft) % 2;

  const winningDigits = availableDigits.filter(
    d => winnerFromState((board.sumMod9 + d) % 9, turnsLeft - 1) === currentPlayer
  );
  if (winningDigits.length > 0) {
    moves.chooseDigit(board, sample(winningDigits));
    return;
  }

  // Losing position: minimise opponent's winning replies, pick randomly among equally bad moves.
  const opponentWinCount = d => {
    const nextSumMod9 = (board.sumMod9 + d) % 9;
    if (turnsLeft < 2) return 0;
    return availableDigits.filter(
      d2 => winnerFromState((nextSumMod9 + d2) % 9, turnsLeft - 2) === (1 - currentPlayer)
    ).length;
  };
  const counts = availableDigits.map(opponentWinCount);
  const minCount = Math.min(...counts);
  const leastBadDigits = availableDigits.filter((_, i) => counts[i] === minCount);
  moves.chooseDigit(board, sample(leastBadDigits));
};

const rule = {
  hu: <>
    Jenő és Béla felváltva választanak egy-egy számjegyet az &#123;1, 2, 3, 4, 5, 6&#125; halmazból
    (Jenő kezd), és egymás mellé írják őket – így közösen felépítenek egy 10 jegyű számot.
    Béla nyer, ha a kapott szám osztható 9-cel, egyébként Jenő nyer.
  </>,
  en: <>
    Alice and Bob alternately choose a digit from &#123;1, 2, 3, 4, 5, 6&#125; (Alice starts),
    writing them one after another to build a 10-digit number together.
    Bob wins if the resulting number is divisible by 9; otherwise Alice wins.
  </>
};

export const TenDigitNumber = strategyGameFactory({
  presentation: {
    rule,
    roleLabels: [
      { hu: 'Jenő', en: 'Alice' },
      { hu: 'Béla', en: 'Bob' }
    ],
    getPlayerStepDescription: () => ({
      hu: 'Válassz egy számjegyet 1 és 6 között.',
      en: 'Choose a digit between 1 and 6.'
    })
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      label: { hu: 'Teszt 🤖', en: 'Test 🤖' }
    },
    {
      // smart bot: verified as optimal
      botStrategy: smartBotStrategy,
      generateStartBoard: () => ({ digits: [], sumMod9: 0 }),
      label: { hu: 'Okos 🤖', en: 'Smart 🤖' },
      isDefault: true
    }
  ]
});
