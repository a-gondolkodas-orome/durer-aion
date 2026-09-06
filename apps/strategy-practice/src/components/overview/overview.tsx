import { useState } from 'react';
import { gameList, type Category, type IconKey } from '../games/gameList';
import { useTranslation, LanguageSelector, type I18nNode } from 'language';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import { IconButton } from '@mui/material';
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
  AB: { hu: '5-8. osztályosoknak (A-B kategória)', en: 'For grades 5–8 (A–B category)' },
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

  return <main className="flex-1 w-full">
    <OverviewHeader
      filtersOpen={showFilters}
      onToggleFilters={() => setShowFilters(o => !o)}
      activeFilterCount={selectedCategories.length + selectedIcons.length}
    />
    <div className="px-2 sm:px-3 py-3 sm:py-4 mb-10">
      {showFilters && (
        <div className="mt-2 pt-3 flex flex-col gap-1 mb-2">
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
    </div>

    <div className="primary-surface md:hidden fixed bottom-0 left-0 right-0 flex justify-end items-center gap-3 px-3
      py-4">
      <ThemeSwitcher />
      <LanguageSelector />
    </div>
  </main>;
};

const OverviewHeader = ({ filtersOpen, onToggleFilters, activeFilterCount }: {
  filtersOpen: boolean
  onToggleFilters: () => void
  activeFilterCount: number
}) => {
  const { t } = useTranslation();
  return <>
    <header className="primary-surface sticky top-0 z-40 shadow-md font-roboto">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <IconButton
              component="a"
              href="/.."
              aria-label="Home"
              size="small"
              sx={{ color: 'white', '&:hover': { color: '#eeeeee' } }}
            >
              <HomeRoundedIcon fontSize="small" />
            </IconButton>
            <h1 className="text-white font-bold text-2xl sm:text-3xl tracking-tight">
              {t({ hu: 'Dürer stratégiás játékok', en: 'Dürer Strategy Games' })}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <FilterToggle open={filtersOpen} onToggle={onToggleFilters} activeCount={activeFilterCount} />
            <span className="hidden md:flex items-center gap-2">
              <ThemeSwitcher />
              <LanguageSelector />
            </span>
          </div>
        </div>
      </div>
    </header>
    <div className="max-w-[100ch] mx-auto mt-6 pb-3 text-left px-3 sm:px-5.5 pl-2">
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
