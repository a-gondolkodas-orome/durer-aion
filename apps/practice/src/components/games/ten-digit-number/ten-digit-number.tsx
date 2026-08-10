import { strategyGameFactory, type BoardClientProps, GameBoard } from 'strategy-game-factory';
import { useTranslation } from 'language';
import { availableDigits, moves, totalDigits, type Board } from './gameplay';
import { randomBotStrategy, smartBotStrategy } from './bot-strategy';

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
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900 text-blue-400 dark:text-blue-300'
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
            disabled={!moves.chooseDigit.isAllowed(board, d)}
            onClick={(e) => { moves.chooseDigit(board, d); e.currentTarget.blur(); }}
            className="rounded-lg border-2 text-2xl w-12 py-2 font-bold
              enabled:hocus:bg-blue-100 dark:enabled:hocus:bg-blue-900
              enabled:hocus:border-blue-300 disabled:opacity-50"
          >
            {d}
          </button>
        ))}
      </div>
    </GameBoard>
  );
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
      label: { hu: 'Teszt', en: 'Test' }
    },
    {
      botStrategy: smartBotStrategy,
      startBoards: [{ digits: [], sumMod9: 0 }],
      label: { hu: 'Teljes', en: 'Full' },
      isDefault: true
    }
  ]
});
