import { useState } from 'react';
import { gameList, type Category, type IconKey } from '../games/gameList';
import { useTranslation, LanguageSelector, type I18nNode } from '../../language';
import { ThemeSwitcher } from '../../theme';
import {
  FilterToggle, CategoryFilter, IconFilter, filterByCategories, filterByIcons
} from './filters/filters';
import {
  FeaturedStrip,
  CategorySection,
  sectionOrder,
  defaultOpenSections,
  getFeaturedGames,
  groupBySection,
  orderByCategoryThenYear,
  type SectionKey
} from './game-list/sections';

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
