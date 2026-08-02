import { useState } from 'react';
import { type BoardClientProps, GameBoard } from '../../strategy-game-factory';
import { useTranslation } from '../../../language';
import { type Board, type Coef, COEFS, integerRoots } from './helpers';

// Any integer is allowed; the digit cap only keeps arithmetic exact (< 2^53).
const isValidValue = (raw: string): boolean => /^-?\d{1,12}$/.test(raw.trim());

// "(x - 2)", "(x + 3)", "x" (for root 0)
const factor = (r: number): string =>
  r === 0 ? 'x' : r > 0 ? `(x - ${r})` : `(x + ${-r})`;

// A coefficient is "open" when it is empty and this client may fill it.
const CoefChip = (
  { label, value, isOpen }: { label: Coef; value: number | null; isOpen: boolean }
) => (
  <span
    className={`inline-flex items-center justify-center min-w-9 h-9 px-2 rounded-md border-2 font-bold
      ${value !== null
        ? 'border-slate-500'
        : isOpen
          ? 'border-blue-400 bg-blue-50 dark:bg-blue-900 text-blue-500 dark:text-blue-300'
          : 'border-slate-400 opacity-60'}`}
    aria-label={`${label} = ${value ?? '?'}`}
  >
    {value ?? label}
  </span>
);

export const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();
  const [inputs, setInputs] = useState<Record<Coef, string>>({ a: '', b: '', c: '' });

  // The text has to parse before there is a value to judge; from there on the
  // move's own validator decides, and the engine ignores a dispatch it rejects.
  const submit = (coef: Coef) => {
    const raw = inputs[coef];
    if (!isValidValue(raw)) return;
    moves.setCoefficient(board, coef, parseInt(raw, 10));
    setInputs(prev => ({ ...prev, [coef]: '' }));
  };

  const roots = board.a !== null && board.b !== null && board.c !== null
    ? integerRoots(board.a, board.b, board.c)
    : undefined;

  return (
    <GameBoard>
      <div className="flex items-center gap-1.5 flex-wrap text-xl mb-4">
        <span className="font-serif italic mr-1">P(x) =</span>
        <span>x³</span>
        <span>+</span>
        <CoefChip label="a" value={board.a} isOpen={board.a === null && ctx.isClientMoveAllowed} />
        <span>·x²</span>
        <span>+</span>
        <CoefChip label="b" value={board.b} isOpen={board.b === null && ctx.isClientMoveAllowed} />
        <span>·x</span>
        <span>+</span>
        <CoefChip label="c" value={board.c} isOpen={board.c === null && ctx.isClientMoveAllowed} />
      </div>

      {ctx.phase === 'play' && (
        <div className="flex flex-col gap-2 bg-surface-elevated rounded-lg p-3">
          {COEFS.filter(coef => board[coef] === null).map(coef => (
            <div key={coef} className="flex items-center gap-2">
              <label
                htmlFor={`coef-${coef}`}
                className="w-8 shrink-0 whitespace-nowrap font-bold text-lg"
              >{coef} =</label>
              <input
                id={`coef-${coef}`}
                type="number"
                inputMode="numeric"
                value={inputs[coef]}
                disabled={!ctx.isClientMoveAllowed}
                onChange={e => setInputs(prev => ({ ...prev, [coef]: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') submit(coef); }}
                className="w-36 px-2 py-1.5 rounded-md border-2 border-slate-400
                  disabled:opacity-50 bg-transparent"
                placeholder={t({ hu: 'egész szám', en: 'integer' })}
              />
              <button
                disabled={!isValidValue(inputs[coef])
                  || !moves.setCoefficient.isAllowed(board, coef, parseInt(inputs[coef], 10))}
                onClick={() => submit(coef)}
                className="rounded-md border-2 px-3 py-1.5 font-bold
                  enabled:hocus:bg-blue-100 dark:enabled:hocus:bg-blue-900
                  enabled:hocus:border-blue-300 disabled:opacity-50"
              >
                {t({ hu: 'Beállít', en: 'Set' })}
              </button>
            </div>
          ))}
        </div>
      )}

      {roots !== undefined && (
        <p className="mt-4 text-sm">
          {roots
            ? t({
              hu: `P(x) = ${factor(roots[0])}·${factor(roots[1])}·${factor(roots[2])} — gyökök: ${roots.join(', ')}`,
              en: `P(x) = ${factor(roots[0])}·${factor(roots[1])}·${factor(roots[2])} — roots: ${roots.join(', ')}`
            })
            : t({
              hu: 'A polinomnak nincs három egész gyöke.',
              en: 'The polynomial does not have three integer roots.'
            })}
        </p>
      )}
    </GameBoard>
  );
};
