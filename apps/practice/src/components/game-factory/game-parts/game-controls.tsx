import { useTranslation, type I18nString } from '../../language';
import type { Variant, Ctx, Mode } from '../types';

export const ModeSelector = ({ isHumanVsHumanGame, onSwitchMode, disabled }: {
  isHumanVsHumanGame: boolean
  onSwitchMode: (mode: Mode) => void
  disabled: boolean
}) => {
  const { t } = useTranslation();

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
            name="mode"
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
            name="mode"
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

  return (
    <fieldset>
      <legend className="text-xs text-slate-600 dark:text-slate-400 mb-1.5">
        {t({ hu: 'Nehézség', en: 'Difficulty' })}
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
              name="difficulty"
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
  grow py-1 px-2 text-center
  ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}
  ${active ? 'bg-blue-500 text-white font-semibold' : 'bg-slate-100 dark:bg-slate-700'}
  ${!active && !disabled ? 'hocus:bg-slate-200 dark:hocus:bg-slate-600' : ''}
`;

export const getCtaText = ({
  phase,
  isHumanVsHumanGame,
  isClientMoveAllowed,
  currentPlayer,
  winnerIndex,
  chosenRoleIndex,
  resolvedPlayerNames
}: Ctx): I18nString => {
  if (phase === 'roleSelection') {
    return isHumanVsHumanGame
      ? { hu: 'Döntsétek el, hogy ki kezd.', en: 'Decide who goes first.' }
      : { hu: 'Válassz szerepet!', en: 'Choose a role!' };
  }
  if (phase === 'play') {
    return isHumanVsHumanGame
      ? { hu: `Következik: ${resolvedPlayerNames[currentPlayer!]}`, en: `Next: ${resolvedPlayerNames[currentPlayer!]}` }
      : isClientMoveAllowed
        ? { hu: 'Te jössz', en: 'Your turn' }
        : { hu: 'Mi jövünk', en: "Computer's turn" };
  }
  else {
    return isHumanVsHumanGame
      ? { hu: `A játékot nyerte: ${resolvedPlayerNames[winnerIndex!]}`,
          en: `Winner: ${resolvedPlayerNames[winnerIndex!]}` }
      : winnerIndex === chosenRoleIndex
        ? { hu: 'Nyertél. Gratulálunk! :)', en: 'You won. Congratulations! :)' }
        : {
          hu: 'Sajnos, most nem nyertél, de ne add fel.',
          en: "Unfortunately you didn't win this time, but don't give up."
        };
  }
};
