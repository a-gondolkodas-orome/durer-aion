import { type ReactNode } from 'react';
import { every } from 'lodash';
import { gameList, categories, iconKeys, type Category, type GameList, type IconKey } from '../../games/gameList';
import { useTranslation, type I18nString } from '../../../language';
import { GameIcon, iconLabels } from '../game-icons';

// Keep only games matching at least one of the selected categories. An empty
// selection matches everything. Mirrors the previous `shouldShow` semantics.
export const filterByCategories = (
  ids: string[],
  selected: Category[],
  list: GameList
): string[] => {
  if (selected.length === 0) return ids;
  return ids.filter(id =>
    !every(list[id].category, c => !selected.includes(c))
  );
};

// The distinct icons actually used by the catalog, in canonical `iconKeys`
// order. Only these are offered as "filter by type" options, so the filter row
// never shows a type with no games behind it.
export const getUsedIcons = (list: GameList): IconKey[] => {
  const used = new Set(Object.values(list).map(entry => entry.icon));
  return iconKeys.filter(key => used.has(key));
};

// Keep only games whose icon is one of the selected types. An empty selection
// matches everything (mirrors `filterByCategories`).
export const filterByIcons = (
  ids: string[],
  selected: IconKey[],
  list: GameList
): string[] => {
  if (selected.length === 0) return ids;
  return ids.filter(id => selected.includes(list[id].icon));
};

// Funnel/filter glyph for the header toggle that shows or hides the filter panel.
const FunnelIcon = () => (
  <svg
    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}
    strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"
    aria-hidden focusable="false"
  >
    <path d="M3 5h18l-7 8v6l-4-2v-4L3 5Z" />
  </svg>
);

// The header button that toggles the whole filter panel. Stays highlighted (and
// shows a count) while filters are active, so applied filters are discoverable
// even when the panel is collapsed to save space.
export const FilterToggle = ({ open, onToggle, activeCount }: {
  open: boolean
  onToggle: () => void
  activeCount: number
}) => {
  const { t } = useTranslation();
  return (
    <button
      onClick={onToggle}
      aria-expanded={open}
      aria-label={t({ hu: 'Szűrők', en: 'Filters' })}
      className={`
        h-8 px-2 inline-flex items-center gap-1 rounded-sm drop-shadow-md
        ${open || activeCount > 0
          ? 'bg-blue-200 dark:bg-blue-800'
          : 'bg-surface-elevated hocus:bg-blue-200 dark:hocus:bg-blue-800'}
      `}
    >
      <FunnelIcon />
      {activeCount > 0 && <span className="text-xs font-bold">{activeCount}</span>}
    </button>
  );
};

// A single filter row: a label followed by multi-select toggle buttons and a
// clear (×) button. Shared by the category and type filters so both look and
// behave the same. Visibility of the whole panel is controlled by FilterToggle,
// so the rows themselves are always expanded when rendered.
type FilterOption<T> = {
  value: T
  content: ReactNode       // shown inside the toggle button
  label?: string           // accessible label + tooltip when `content` isn't readable text
  buttonClassName?: string // per-option sizing (defaults to text-style padding)
};

const FilterRow = <T,>({ label, options, selected, onChange }: {
  label: I18nString
  options: FilterOption<T>[]
  selected: T[]
  onChange: (selected: T[]) => void
}) => {
  const { t } = useTranslation();
  const toggle = (value: T) =>
    onChange(selected.includes(value) ? selected.filter(s => s !== value) : [...selected, value]);

  return (
    <div className="flex flex-wrap items-center gap-1 text-sm">
      <span className="w-20 shrink-0">{t(label)}</span>
      {options.map(({ value, content, label: optionLabel, buttonClassName }) => {
        const isSelected = selected.includes(value);
        return (
          <button
            key={String(value)}
            onClick={() => toggle(value)}
            aria-label={optionLabel}
            aria-pressed={isSelected}
            title={optionLabel}
            className={`
              h-7 inline-flex items-center justify-center rounded-sm drop-shadow-md ${buttonClassName ?? 'px-2'}
              ${isSelected
                ? 'bg-blue-200 dark:bg-blue-800 hocus:bg-slate-200 dark:hocus:bg-slate-700'
                : 'bg-surface-elevated hocus:bg-blue-200 dark:hocus:bg-blue-800'}`}
          >{content}</button>
        );
      })}
      <button
        onClick={() => onChange([])}
        disabled={selected.length === 0}
        aria-label={t({ hu: 'Szűrés törlése', en: 'Clear filters' })}
        className={`
          h-7 inline-flex items-center px-2 rounded-sm drop-shadow-md
          enabled:hocus:bg-slate-200 dark:enabled:hocus:bg-slate-700
          disabled:invisible disabled:cursor-default
        `}
      >×</button>
    </div>
  );
};

export const CategoryFilter = ({ selected, onChange }: {
  selected: Category[]
  onChange: (selected: Category[]) => void
}) => (
  <FilterRow
    label={{ hu: 'Kategória', en: 'Category' }}
    selected={selected}
    onChange={onChange}
    options={categories.map(c => ({ value: c, content: c }))}
  />
);

export const IconFilter = ({ selected, onChange }: {
  selected: IconKey[]
  onChange: (selected: IconKey[]) => void
}) => {
  const { t } = useTranslation();
  return (
    <FilterRow
      label={{ hu: 'Típus', en: 'Type' }}
      selected={selected}
      onChange={onChange}
      options={getUsedIcons(gameList).map(iconKey => ({
        value: iconKey,
        content: <GameIcon iconKey={iconKey} />,
        label: t(iconLabels[iconKey]),
        buttonClassName: 'w-7 p-1'
      }))}
    />
  );
};
