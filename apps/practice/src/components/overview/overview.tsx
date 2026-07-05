import { useState, type ReactNode } from 'react';
import { gameList, type Category, type IconKey } from '../games/gameList';
import { useTranslation, LanguageSelector, type I18nNode, type I18nString } from '../language';
import { ThemeSwitcher } from '../theme';
import { FeaturedStrip } from './featured-strip';
import { CategorySection } from './category-section';
import { GameIcon, iconLabels } from './game-icons';
import {
  sectionOrder,
  defaultOpenSections,
  getFeaturedGames,
  groupBySection,
  getUsedIcons,
  filterByCategories,
  filterByIcons,
  orderByCategoryThenYear,
  type SectionKey
} from './selection';

const sectionTitles: Record<SectionKey, I18nNode> = {
  AB:  { hu: '5-8. osztályosoknak (A-B kategória)', en: 'For grades 5–8 (A–B category)' },
  CDE: { hu: '9-12. osztályosoknak (C-D-E kategória)', en: 'For grades 9–12 (C-D-E category)' }
};

export const Overview = () => {
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [selectedIcons, setSelectedIcons] = useState<IconKey[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const isFiltering = selectedCategories.length > 0 || selectedIcons.length > 0;

  const allIds = Object.keys(gameList);
  const visibleIds = filterByIcons(
    filterByCategories(allIds, selectedCategories, gameList),
    selectedIcons,
    gameList
  );
  const groups = groupBySection(visibleIds, gameList);

  const featuredIds = orderByCategoryThenYear(
    filterByIcons(
      filterByCategories(getFeaturedGames(gameList), selectedCategories, gameList),
      selectedIcons,
      gameList
    ),
    gameList
  );

  return <main className="p-2">
    <OverviewHeader
      filtersOpen={showFilters}
      onToggleFilters={() => setShowFilters(o => !o)}
      activeFilterCount={selectedCategories.length + selectedIcons.length}
    />
    {showFilters && (
      <div className="border-t mt-2 pt-3 flex flex-col gap-1 mb-2">
        <CategoryFilter selected={selectedCategories} onChange={setSelectedCategories} />
        <IconFilter selected={selectedIcons} onChange={setSelectedIcons} />
      </div>
    )}

    <FeaturedStrip gameIds={featuredIds} />

    {sectionOrder.map(section => (
      <CategorySection
        key={section}
        title={sectionTitles[section]}
        gameIds={orderByCategoryThenYear(groups[section], gameList)}
        defaultOpen={defaultOpenSections.includes(section)}
        forceOpen={isFiltering}
        storageKey={section}
      />
    ))}

    <footer className="md:hidden flex justify-end items-center gap-3 mt-4 px-2">
      <ThemeSwitcher />
      <LanguageSelector />
    </footer>
  </main>;
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
const FilterToggle = ({ open, onToggle, activeCount }: {
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

const categories: Category[] = ['A', 'B', 'C', 'D', 'E', 'E+'];

const CategoryFilter = ({ selected, onChange }: {
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

const IconFilter = ({ selected, onChange }: {
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

const OverviewHeader = ({ filtersOpen, onToggleFilters, activeFilterCount }: {
  filtersOpen: boolean
  onToggleFilters: () => void
  activeFilterCount: number
}) => {
  const { t } = useTranslation();
  return <>
    <header className="flex items-center gap-2 pb-2">
      <h1 className="grow text-blue-600 dark:text-blue-400 font-bold text-center">
        {t({ hu: 'Dürer stratégiás játékok', en: 'Dürer Strategy Games' })}
      </h1>
      <FilterToggle open={filtersOpen} onToggle={onToggleFilters} activeCount={activeFilterCount} />
      <span className="hidden md:flex items-center gap-2">
        <ThemeSwitcher />
        <LanguageSelector />
      </span>
    </header>
    <div className="max-w-[100ch] mx-auto pb-2">
      {t({
        hu: <>
          A <i>stratégiás játék</i> egy két szereplős játék,
          amelyben nincs szerencsefaktor: optimális stratégiával mindig nyerni lehet,
          így matekfeladatként is tekinthető.
          Az alábbi, A-tól E+ kategóriáig nehezedő játékok
          a <a href="https://durerinfo.hu">Dürer Versenyen</a> szerepeltek.
        </>,
        en: <>
          A <i>strategy game</i> is a two-player game with no luck involved:
          the right strategy always wins, making it essentially a math puzzle.
          The games below, ranging from category A to E+ in difficulty,
          all featured in the <a href="https://durerinfo.hu">Dürer Competition</a>.
        </>
      })}
    </div>
  </>;
};
