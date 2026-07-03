import { useState } from 'react';
import { gameList, type Category } from '../games/gameList';
import { useTranslation, LanguageSelector, type I18nNode } from '../language';
import { ThemeSwitcher } from '../theme';
import { FeaturedStrip } from './featured-strip';
import { CategorySection } from './category-section';
import {
  sectionOrder,
  defaultOpenSections,
  getFeaturedGames,
  groupBySection,
  filterByCategories,
  orderByCategoryThenYear,
  type SectionKey
} from './selection';

const sectionTitles: Record<SectionKey, I18nNode> = {
  AB:  { hu: '5-8. osztályosoknak (A-B kategória)', en: 'For grades 5–8 (A–B category)' },
  CDE: { hu: '9-12. osztályosoknak (C-D-E kategória)', en: 'For grades 9–12 (C-D-E category)' }
};

export const Overview = () => {
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const isFiltering = selectedCategories.length > 0;

  const allIds = Object.keys(gameList);
  const visibleIds = filterByCategories(allIds, selectedCategories, gameList);
  const groups = groupBySection(visibleIds, gameList);

  const featuredIds = orderByCategoryThenYear(
    filterByCategories(getFeaturedGames(gameList), selectedCategories, gameList),
    gameList
  );

  return <main className="p-2">
    <OverviewHeader />
    <div className="border-t mt-2 pt-3 flex flex-wrap items-center gap-1 mb-2">
      <CategoryFilter selected={selectedCategories} onChange={setSelectedCategories} />
    </div>

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

const CategoryFilter = ({ selected, onChange }: {
  selected: Category[]
  onChange: (selected: Category[]) => void
}) => {
  const { t } = useTranslation();
  const categories = [
    { k: 'A', v: 'A' },
    { k: 'B', v: 'B' },
    { k: 'C', v: 'C' },
    { k: 'D', v: 'D' },
    { k: 'E', v: 'E' },
    { k: 'E+', v: 'E+' }
  ] as const;
  return (
    <div className="flex flex-wrap items-center gap-1 text-sm">
      <span>{t({ hu: 'Szűrés kategóriákra:', en: 'Filter by category:' })}</span>
      {categories.map(({ k, v }) =>
        <button
          key={v}
          onClick={() => onChange(selected.includes(v) ? selected.filter(s => s !== v) : [...selected, v])}
          className={`
            px-2 rounded-sm drop-shadow-md
            ${selected.includes(v)
              ? 'bg-blue-200 dark:bg-blue-800 hocus:bg-slate-200 dark:hocus:bg-slate-700'
              : 'bg-surface-elevated hocus:bg-blue-200 dark:hocus:bg-blue-800'}`}
        >{k}</button>
      )}
      <button
        onClick={() => onChange([])}
        disabled={selected.length === 0}
        aria-label={t({ hu: 'Szűrés törlése', en: 'Clear filters' })}
        className={`
          px-2 rounded-sm drop-shadow-md enabled:hocus:bg-slate-200 dark:enabled:hocus:bg-slate-700
          disabled:invisible disabled:cursor-default
        `}
      >×</button>
    </div>
  );
};

const OverviewHeader = () => {
  const { t } = useTranslation();
  return <>
    <header className="flex flex-wrap items-baseline pb-2">
      <h1 className="grow text-blue-600 dark:text-blue-400 font-bold text-center">
        {t({ hu: 'Dürer stratégiás játékok', en: 'Dürer Strategy Games' })}
      </h1>
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
