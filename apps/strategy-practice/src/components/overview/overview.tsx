import { useState } from 'react';
import { gameList, type Category, type IconKey, type Round } from '../games/gameList';
import { Trans, useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { LanguageSelector } from 'language';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import { IconButton } from '@mui/material';
import { ThemeSwitcher } from '../../theme';
import {
  FilterToggle, CategoryFilter, IconFilter, YearFilter, RoundFilter,
  filterByCategories, filterByIcons, filterByYears, filterByRounds
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

const sectionTitles = (t: TFunction<'overview'>): Record<SectionKey, string> => ({
  AB: t('section.AB'),
  CDE: t('section.CDE')
});

export const Overview = () => {
  const { t } = useTranslation('overview');
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [selectedIcons, setSelectedIcons] = useState<IconKey[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedRounds, setSelectedRounds] = useState<Round[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const isFiltering = selectedCategories.length > 0 || selectedIcons.length > 0 ||
    selectedYears.length > 0 || selectedRounds.length > 0;

  const allIds = Object.keys(gameList);
  const applyFilters = (ids: string[]) => filterByRounds(
    filterByYears(
      filterByIcons(
        filterByCategories(ids, selectedCategories, gameList),
        selectedIcons,
        gameList
      ),
      selectedYears,
      gameList
    ),
    selectedRounds,
    gameList
  );
  const visibleIds = applyFilters(allIds);
  const groups = groupBySection(visibleIds, gameList);

  const featuredIds = orderByCategoryThenYear(
    applyFilters(getFeaturedGames(gameList)),
    gameList
  );

  return <main className="flex-1 w-full">
    <OverviewHeader
      filtersOpen={showFilters}
      onToggleFilters={() => setShowFilters(o => !o)}
      activeFilterCount={selectedCategories.length + selectedIcons.length +
        selectedYears.length + selectedRounds.length}
    />
    <div className="px-2 sm:px-3 py-3 sm:py-4 mb-10">
      {showFilters && (
        <div className="mt-2 pt-3 flex flex-col gap-1 mb-2">
          <CategoryFilter selected={selectedCategories} onChange={setSelectedCategories} />
          <IconFilter selected={selectedIcons} onChange={setSelectedIcons} />
          <YearFilter selected={selectedYears} onChange={setSelectedYears} />
          <RoundFilter selected={selectedRounds} onChange={setSelectedRounds} />
        </div>
      )}

      <FeaturedStrip gameIds={featuredIds} />

      {sectionOrder.map(section => (
        <CategorySection
          key={section}
          title={sectionTitles(t)[section]}
          gameIds={orderByCategoryThenYear(groups[section], gameList)}
          defaultOpen={defaultOpenSections.includes(section)}
          forceOpen={isFiltering}
          storageKey={section}
        />
      ))}
    </div>

    <div className="primary-footer">
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
  const { t } = useTranslation('overview');
  return <>
    <header className="primary-header">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <IconButton
              component="a"
              href="/.."
              aria-label="Home"
              size="small"
              color="inherit"
            >
              <HomeRoundedIcon fontSize="small" />
            </IconButton>
            <h1 className="text-2xl sm:text-3xl">
              {t('title')}
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
      <Trans t={t} i18nKey="intro" components={{ durerinfo: <a href="https://durerinfo.hu" /> }} />
    </div>
  </>;
};
