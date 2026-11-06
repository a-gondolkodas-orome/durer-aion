import { type ReactNode } from 'react';
import { Slider } from '@mui/material';
import {
  gameList, categories, iconKeys, type Category, type GameList, type IconKey, type Round
} from '../../games/gameList';
import { useTranslation } from 'react-i18next';
import { GameIcon, iconLabels } from '../game-icons';

// Keep only games matching at least one of the selected categories. An empty
// selection matches everything.
export const filterByCategories = (
  ids: string[],
  selected: Category[],
  list: GameList
): string[] => {
  if (selected.length === 0) return ids;
  return ids.filter(id => list[id].category.some(c => selected.includes(c)));
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

// The distinct years the catalog has games from, oldest first. A year reads
// `07/08`, so text order is chronological — until the competition reaches 99/00.
export const getUsedYears = (list: GameList): string[] =>
  [...new Set(Object.values(list).map(entry => entry.year.v))].sort();

// An inclusive range of years, `[from, to]`; `null` matches everything.
export type YearRange = [string, string] | null;

export const filterByYears = (
  ids: string[],
  range: YearRange,
  list: GameList
): string[] => {
  if (range === null) return ids;
  const [from, to] = range;
  return ids.filter(id => from <= list[id].year.v && list[id].year.v <= to);
};

export const filterByRounds = (
  ids: string[],
  selected: Round[],
  list: GameList
): string[] => {
  if (selected.length === 0) return ids;
  return ids.filter(id => selected.includes(list[id].round));
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
  const { t } = useTranslation('overview');
  return (
    <button
      onClick={onToggle}
      aria-expanded={open}
      aria-label={t('filters.toggle')}
      className={`
        h-8 px-2 inline-flex items-center gap-1 rounded-sm drop-shadow-md
        ${open || activeCount > 0 ? 'primary-control-selected' : 'primary-control-muted'}
        transition-colors
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
interface FilterOption<T> {
  value: T
  content: ReactNode       // shown inside the toggle button
  label?: string           // accessible label + tooltip when `content` isn't readable text
  buttonClassName?: string // per-option sizing (defaults to text-style padding)
}

const FilterRow = <T,>({ label, options, selected, onChange }: {
  label: string
  options: FilterOption<T>[]
  selected: T[]
  onChange: (selected: T[]) => void
}) => {
  const toggle = (value: T) =>
    onChange(selected.includes(value) ? selected.filter(s => s !== value) : [...selected, value]);

  return (
    <div className="flex flex-wrap items-center gap-1 text-sm">
      <span className="w-20 shrink-0">{label}</span>
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
              ${isSelected ? 'bg-primary text-white hocus:bg-primary/55' : 'bg-surface-elevated hocus:bg-primary/10'}
              transition-colors`}
          >{content}</button>
        );
      })}
      <ClearButton onClear={() => onChange([])} disabled={selected.length === 0} />
    </div>
  );
};

// The × closing a filter row. It keeps its place while there is nothing to
// clear, so the row does not shift as a filter comes and goes.
const ClearButton = ({ onClear, disabled }: { onClear: () => void, disabled: boolean }) => {
  const { t } = useTranslation('overview');
  return (
    <button
      onClick={onClear}
      disabled={disabled}
      aria-label={t('filters.clear')}
      className={`
        h-7 inline-flex items-center px-2 rounded-sm drop-shadow-md
        enabled:hocus:bg-slate-200 dark:enabled:hocus:bg-slate-700
        disabled:invisible disabled:cursor-default
      `}
    >×</button>
  );
};

export const CategoryFilter = ({ selected, onChange }: {
  selected: Category[]
  onChange: (selected: Category[]) => void
}) => {
  const { t } = useTranslation('overview');
  return (
    <FilterRow
      label={t('filters.category')}
      selected={selected}
      onChange={onChange}
      options={categories.map(c => ({ value: c, content: c }))}
    />
  );
};

export const IconFilter = ({ selected, onChange }: {
  selected: IconKey[]
  onChange: (selected: IconKey[]) => void
}) => {
  const { t } = useTranslation('overview');
  const labels = iconLabels(t);
  return (
    <FilterRow
      label={t('filters.type')}
      selected={selected}
      onChange={onChange}
      options={getUsedIcons(gameList).map(iconKey => ({
        value: iconKey,
        content: <GameIcon iconKey={iconKey} />,
        label: labels[iconKey],
        buttonClassName: 'w-7 p-1'
      }))}
    />
  );
};

// Whether the year at `index` gets a label under its tick. Every fifth one
// does, counting from the oldest, and so does the newest — the fifth before it
// gives way when the two would sit too close to read.
const isLabelledYear = (index: number, last: number) =>
  index === last || (index % 5 === 0 && last - index > 2);

export const YearFilter = ({ range, onChange }: {
  range: YearRange
  onChange: (range: YearRange) => void
}) => {
  const { t } = useTranslation('overview');
  const years = getUsedYears(gameList);
  const last = years.length - 1;
  const [from, to] = range === null ? [0, last] : range.map(year => years.indexOf(year));

  return (
    <div className="flex flex-wrap items-center gap-1 text-sm">
      <span className="w-20 shrink-0">{t('filters.year')}</span>
      {/* The padding keeps the end thumbs, centred on the slider's edges, inside the row. */}
      <div className="flex-1 min-w-48 max-w-xl px-3 pt-1">
        <Slider
          size="small"
          value={[from, to]}
          min={0}
          max={last}
          marks={years.map((year, index) => ({ value: index, label: isLabelledYear(index, last) ? year : undefined }))}
          disableSwap
          onChange={(_, [newFrom, newTo]) =>
            onChange(newFrom === 0 && newTo === last ? null : [years[newFrom], years[newTo]])}
          valueLabelDisplay="auto"
          valueLabelFormat={index => years[index]}
          getAriaValueText={index => years[index]}
          getAriaLabel={thumb => (thumb === 0 ? t('filters.yearFrom') : t('filters.yearTo'))}
        />
      </div>
      {/* The range in words: on a touch screen the thumbs' own labels show only mid-drag. */}
      <span className={`tabular-nums ${range === null ? 'opacity-60' : ''}`}>{years[from]} – {years[to]}</span>
      <ClearButton onClear={() => onChange(null)} disabled={range === null} />
    </div>
  );
};

export const RoundFilter = ({ selected, onChange }: {
  selected: Round[]
  onChange: (selected: Round[]) => void
}) => {
  const { t } = useTranslation('overview');
  return (
    <FilterRow
      label={t('filters.round')}
      selected={selected}
      onChange={onChange}
      options={[
        { value: 'döntő', content: t('round.final') },
        { value: 'online', content: t('round.online') }
      ]}
    />
  );
};
