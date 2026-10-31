import { type PointerEvent as ReactPointerEvent, type ReactNode, useRef } from 'react';
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

export const getUsedYears = (list: GameList): string[] => {
  const years = new Set(Object.values(list).map(entry => entry.year.v));
  return [...years];
};

export const filterByYears = (
  ids: string[],
  selected: string[],
  list: GameList
): string[] => {
  if (selected.length === 0) return ids;
  return ids.filter(id => selected.includes(list[id].year.v));
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
  const { t } = useTranslation('overview');
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
      <button
        onClick={() => onChange([])}
        disabled={selected.length === 0}
        aria-label={t('filters.clear')}
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

export const YearFilter = ({ selected, onChange }: {
  selected: string[]
  onChange: (selected: string[]) => void
}) => {
  const { t } = useTranslation('overview');
  const years = getUsedYears(gameList);
  const dragging = useRef(false);
  const suppressClick = useRef(false);
  const visited = useRef(new Set<string>());
  const timeline = useRef<HTMLDivElement>(null);
  const toggle = (year: string) =>
    onChange(selected.includes(year) ? selected.filter(value => value !== year) : [...selected, year]);
  const startDragging = (year: string) => {
    dragging.current = true;
    suppressClick.current = true;
    visited.current = new Set([year]);
    toggle(year);
  };
  const dragOver = (year: string) => {
    if (!dragging.current || visited.current.has(year)) return;
    visited.current.add(year);
    toggle(year);
  };
  const finishDragging = () => {
    dragging.current = false;
    visited.current.clear();
  };
  const moveDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const node = document.elementsFromPoint(event.clientX, event.clientY)
      .find(element => element instanceof HTMLElement && element.dataset.year);
    if (node instanceof HTMLElement && node.dataset.year) dragOver(node.dataset.year);
  };
  const capturePointer = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (timeline.current?.setPointerCapture) timeline.current.setPointerCapture(event.pointerId);
    const year = event.currentTarget.dataset.year;
    if (year) startDragging(year);
  };

  return (
    <div className="flex flex-wrap items-center gap-1 text-sm mb-2">
      <span className="w-20 shrink-0">{t('filters.year')}</span>
      <div
        ref={timeline}
        className="relative flex min-w-32 w-full shrink-0 items-center justify-between
          overflow-clip py-3 px-3 touch-none"
        onPointerUp={finishDragging}
        onPointerCancel={finishDragging}
        onPointerMove={moveDragging}
        style={{ maxWidth: `${35 * years.length + 20}px` }}
      >
        <span className="absolute left-2 right-2 top-1/2 h-px bg-slate-300 dark:bg-slate-600" aria-hidden />
        {years.map((year, index) => {
          const isSelected = selected.includes(year);
          return (
            <div
              key={year}
              data-year={year}
              className="relative z-10 flex h-9 shrink-0 items-center justify-center"
              onPointerEnter={() => dragOver(year)}
            >
              {(index === 0 || index === years.length - 1) && (
                <span className="absolute text-xs" style={{ bottom: '-10px' }}>{year}</span>
              )}
              <button
                onClick={() => {
                  if (suppressClick.current) suppressClick.current = false;
                  else toggle(year);
                }}
                onPointerDown={capturePointer}
                data-year={year}
                role="checkbox"
                aria-checked={isSelected}
                aria-label={year}
                title={year}
                className="absolute flex h-6 w-6 items-center justify-center rounded-full
                  hocus:bg-primary/10"
                />
              <span className={`h-3 w-3 rounded-full border-2 border-surface
                  ${isSelected ? 'bg-primary' : 'bg-slate-400 dark:bg-slate-500'}`}
                />
            </div>
          );
        })}
      </div>
      <button
        onClick={() => onChange([])}
        disabled={selected.length === 0}
        aria-label={t('filters.clear')}
        className="h-7 inline-flex items-center px-2 rounded-sm drop-shadow-md
          enabled:hocus:bg-slate-200 dark:enabled:hocus:bg-slate-700
          disabled:invisible disabled:cursor-default"
      >×</button>
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
