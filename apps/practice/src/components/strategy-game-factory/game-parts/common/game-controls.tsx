import { useId } from 'react';
import { useTranslation } from 'language';
import type { Variant, Mode } from '../../types';

// Radios sharing a `name` form one native group, and the browser keeps exactly
// one of them checked. The sidebar and the game-end dialog each render these
// selectors into the same document, so a fixed name made the two instances one
// group: clicking the dialog's choice unchecked the sidebar's, and React —
// whose own state had not changed there — left it that way. useId gives each
// instance its own group.

export const ModeSelector = ({ isHumanVsHumanGame, onSwitchMode, disabled }: {
  isHumanVsHumanGame: boolean
  onSwitchMode: (mode: Mode) => void
  disabled: boolean
}) => {
  const { t } = useTranslation();
  const groupName = useId();

  return (
    <fieldset>
      <legend className="text-xs text-slate-600 dark:text-slate-400 mb-1.5">
        {t({ hu: 'Játékmód', en: 'Game mode' })}
      </legend>
      <div className={`flex divide-x divide-slate-300 rounded-lg overflow-hidden border text-sm
        has-focus-visible:ring-2 has-focus-visible:ring-red-400 has-focus-visible:ring-offset-1`}>
        <label className={labelClass(!isHumanVsHumanGame, disabled)}>
          <input
            type="radio"
            name={groupName}
            className="sr-only"
            data-testid="mode-vsComputer"
            checked={!isHumanVsHumanGame}
            onChange={() => onSwitchMode('vsComputer')}
            disabled={disabled}
          />
          🤖 {t({ hu: 'Gép ellen', en: 'vs Computer' })}
        </label>
        <label className={labelClass(isHumanVsHumanGame, disabled)}>
          <input
            type="radio"
            name={groupName}
            className="sr-only"
            data-testid="mode-vsHuman"
            checked={isHumanVsHumanGame}
            onChange={() => onSwitchMode('vsHuman')}
            disabled={disabled}
          />
          🤝 {t({ hu: '2 játékos', en: '2 players' })}
        </label>
      </div>
    </fieldset>
  );
};

export const DifficultySelector = ({ variants, selectedIndex, onSelect, disabled: fieldsetDisabled }: {
  variants: Variant[]
  selectedIndex: number
  onSelect: (index: number) => void
  disabled: boolean
}) => {
  const { t } = useTranslation();
  const groupName = useId();

  return (
    <fieldset>
      <legend className="text-xs text-slate-600 dark:text-slate-400 mb-1.5">
        {t({ hu: 'Változat', en: 'Variant' })}
      </legend>
      <div className={`flex divide-x divide-slate-300 rounded-lg overflow-hidden border text-sm
        has-focus-visible:ring-2 has-focus-visible:ring-red-400 has-focus-visible:ring-offset-1`}>
        {variants.map(v => (
          <label
            key={v.originalIndex}
            className={labelClass(v.originalIndex === selectedIndex, v.disabled || fieldsetDisabled)}
            title={v.disabled ? t({ hu: 'Nincs gépi stratégia megadva', en: 'No bot strategy defined' }) : undefined}
          >
            <input
              type="radio"
              name={groupName}
              className="sr-only"
              checked={v.originalIndex === selectedIndex}
              onChange={() => onSelect(v.originalIndex)}
              disabled={v.disabled || fieldsetDisabled}
            />
            {t(v.label ?? { hu: `${v.originalIndex + 1}. szint`, en: `Level ${v.originalIndex + 1}` })}
            {v.notAlwaysOptimal && (
              <span
                className="ml-1 opacity-70 text-xs"
                title={t({
                  hu: 'A gép nem minden esetben tud nyerő lépést találni.',
                  en: 'The bot may not always find a winning move.'
                })}
              >
                ⓘ
              </span>
            )}
          </label>
        ))}
      </div>
    </fieldset>
  );
};

const labelClass = (active: boolean, disabled: boolean) => `
  grow flex items-center justify-center py-1 px-2 text-center
  ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}
  ${active ? 'bg-blue-500 text-white font-semibold' : 'bg-slate-100 dark:bg-slate-700'}
  ${!active && !disabled ? 'hocus:bg-slate-200 dark:hocus:bg-slate-600' : ''}
`;
