import { useState } from 'react';
import { gameList, type GameEntry, type Category } from '../games/gameList';
import { every, orderBy } from 'lodash';
import { Link } from 'react-router';
import { useTranslation, LanguageSelector } from '../language';

export const Overview = () => {
  const { t } = useTranslation();
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);

  const shouldShow = (game: GameEntry) => {
    const noCategoryMatch = selectedCategories.length > 0
      && every(game.category, c => !selectedCategories.includes(c));
    if (noCategoryMatch) return false;
    return true;
  };

  // order by category and then by year regardless of order in gameList.ts
  const gamesToShow = orderBy(
    Object.keys(gameList).filter(id => shouldShow(gameList[id]))
      .sort((a, b) =>
        gameList[a].category[0] > gameList[b].category[0]
        ? 1
        : (gameList[a].category[0] < gameList[b].category[0] ? -1 : 0)
      ),
    a => gameList[a].year.v,
    'desc'
  );

  return <main className="p-2">
    <OverviewHeader />
    <div className="border-t border-slate-300 mt-2 pt-3 flex flex-wrap items-center gap-1 mb-2">
      <CategoryFilter selected={selectedCategories} onChange={setSelectedCategories} />
    </div>
    <h2 className="font-bold my-4 text-center">
      {t({ hu: '5-8. osztályosoknak (A-B kategória)', en: 'For grades 5–8 (A–B category)' })}
    </h2>
    <div className="flex flex-wrap gap-4 justify-center">
      {gamesToShow.filter(id => gameList[id].category[0] <= 'B')
        .map(id => <Game key={id} gameId={id} gameProps={gameList[id]} />)}
    </div>
    <h2 className="font-bold my-4 text-center">
      {t({ hu: '9-12. osztályosoknak (C-D-E kategória)', en: 'For grades 9–12 (C–D–E category)' })}
    </h2>
    <div className="flex flex-wrap gap-4 justify-center">
      {gamesToShow.filter(id => gameList[id].category[0] > 'B')
        .map(id => <Game key={id} gameId={id} gameProps={gameList[id]} />)}
    </div>
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
              ? 'bg-blue-200 hocus:bg-slate-200'
              : 'bg-slate-50 hocus:bg-blue-200'}`}
        >{k}</button>
      )}
      <button
        onClick={() => onChange([])}
        disabled={selected.length === 0}
        aria-label={t({ hu: 'Szűrés törlése', en: 'Clear filters' })}
        className={`
          px-2 rounded-sm drop-shadow-md enabled:hocus:bg-slate-200
          disabled:invisible disabled:cursor-default
        `}
      >×</button>
    </div>
  );
};

const OverviewHeader = () => {
  const { t } = useTranslation();
  return <div className="pb-2">
    <div className="flex justify-end items-center gap-2 mb-1">
      <a
        href="https://forms.gle/7DwugmXNrvKgkiiu8"
        target="_blank"
        rel="noreferrer"
        className="text-sm text-slate-500 hocus:text-slate-600"
      >
        {t({ hu: 'Hibabejelentő', en: 'Bug report' })}
      </a>
      <LanguageSelector />
    </div>
    <h1 className="text-blue-600 font-bold text-center text-2xl pb-2">
      {t({ hu: 'Dürer stratégiás játékok', en: 'Dürer Strategy Games' })}
    </h1>
    <div className="max-w-[100ch] mx-auto">
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
  </div>;
};

const categoryColorClass: Record<Category, string> = {
  'A':  'bg-green-200',
  'B':  'bg-teal-300',
  'C':  'bg-blue-300',
  'D':  'bg-blue-400',
  'E':  'bg-blue-600 text-white',
  'E+': 'bg-blue-800 text-white'
};

const chipBase = 'rounded-full drop-shadow-sm px-2 py-0.5 whitespace-nowrap';

const Game = ({ gameId, gameProps }: { gameId: string; gameProps: GameEntry }) => {
  const { t } = useTranslation();

  const round = gameProps.round === 'döntő'
    ? t({ hu: 'döntő', en: 'final' })
    : gameProps.round;

  const categoryColor = categoryColorClass[gameProps.category[0]];

  return <Link
    to={`/game/${gameId}`}
    data-testid="game-card"
    className={`
      rounded-lg border p-2 max-w-[32ch] w-full flex flex-col
      cursor-pointer hocus:bg-blue-50 hocus:border-blue-400
      no-underline text-inherit
    `}
  >
    <h2 className="font-semibold mb-4 text-center">
      {t(gameProps.name)}
    </h2>
    <div className="grow"></div>
    <div className="flex flex-wrap items-baseline gap-1 text-xs">
      <span className={`${chipBase} bg-slate-50`} title={gameProps.year.k}>{gameProps.year.v}</span>
      <span className={`${chipBase} bg-slate-50`}>{round}</span>
      <span className={`${chipBase} ${categoryColor}`}>{gameProps.category.join(', ')}</span>
      <span className="ml-auto" aria-hidden="true">→</span>
    </div>
  </Link>;
};
