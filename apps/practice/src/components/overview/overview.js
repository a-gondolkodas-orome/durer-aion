import React, { useState } from 'react';
import { gameList } from '../games/gameList';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/react';
import { uniqBy, every, sortBy, orderBy } from 'lodash';
import { Link } from 'react-router';
import { useTranslation } from '../language/translate';
import { useLanguage } from '../language/language-context';
import { LanguageSelector } from '../language/language-selector';

export const Overview = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [enOnly, setEnOnly] = useState(false);

  if (selectedCategories.includes('')) {
    setSelectedCategories([]);
  }
  if (selectedYears.includes('')) {
    setSelectedYears([]);
  }

  const shouldShow = game => {
    const noCategoryMatch = selectedCategories.length > 0
      && !selectedCategories.includes('')
      && every(game.category, c => !selectedCategories.includes(c));
    if (noCategoryMatch) return false;
    if (selectedYears.length > 0 && !selectedYears.includes('') && !selectedYears.includes(game.year.v)) return false;
    if (enOnly && !(typeof game.name === 'object' && 'en' in game.name)) return false;
    return true;
  };

  // order by category and then by year regardless of order in gameList.js
  const gamesToShow = orderBy(
    Object.keys(gameList).filter(id => shouldShow(gameList[id]))
      .sort((a, b) =>
        gameList[a].category[0] > gameList[b].category[0]
        ? 1
        : (gameList[a].category[0] < gameList[b].category[0] ? -1 : 0)
      ),
    a => gameList[a].year.v,
    'desc'
  )

  return <main className="p-2">
    <OverviewHeader></OverviewHeader>
    <div className="flex flex-wrap align-baseline items-end">
      <CategoryFilter
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
      ></CategoryFilter>
      <YearFilter
        selectedYears={selectedYears}
        setSelectedYears={setSelectedYears}
      ></YearFilter>
      {language === 'en' && (
        <label className="mb-2 px-1 flex items-center gap-1 cursor-pointer">
          <input
            type="checkbox"
            checked={enOnly}
            onChange={e => setEnOnly(e.target.checked)}
          />
          EN only
        </label>
      )}
    </div>
    <h2 className="font-bold my-4 text-center">
      {t({ hu: '5-8. osztályosoknak (A-B kategória)', en: 'For grades 5–8 (A–B category)' })}
    </h2>
    <div className="flex flex-wrap justify-center">
      {gamesToShow.filter(id => gameList[id].category[0] <= "B")
        .map(id => <Game key={id} gameId={id} gameProps={gameList[id]} />)}
    </div>
    <h2 className="font-bold my-4 text-center">
      {t({ hu: '9-12. osztályosoknak (C-D-E kategória)', en: 'For grades 9–12 (C–D–E category)' })}
    </h2>
    <div className="flex flex-wrap justify-center">
      {gamesToShow.filter(id => gameList[id].category[0] > "B")
        .map(id => <Game key={id} gameId={id} gameProps={gameList[id]} />)}
    </div>
  </main>;
};

const OverviewFilterOptions = ({ options }) => {
  return <ListboxOptions
    className="text-center py-2 w-(--button-width) shadow-xl bg-slate-100"
    anchor="bottom"
  >
    {options.map(option =>
      <ListboxOption
        key={option.k}
        value={option.v}
        className="inline-block"
      >{({ focus, selected }) =>
        <span className={`
          border-2 rounded-sm px-1 m-1 inline-block
          ${selected ? 'bg-blue-200' : 'bg-white'}
          ${focus ? 'outline' : ''}
        `}>
          {option.v !== '' && <span className={selected ? '' : 'text-transparent'}>✓</span>}{option.k}
        </span>
      }</ListboxOption>
    )}
  </ListboxOptions>;
};

const CategoryFilter = ({ selectedCategories, setSelectedCategories }) => {
  const { t } = useTranslation();
  const allCategories = [
    { k: t({ hu: 'A (5-6.o)', en: 'A (grades 5–6)' }), v: 'A'},
    { k: t({ hu: 'B (7-8.o)', en: 'B (grades 7–8)' }), v: 'B'},
    { k: t({ hu: 'C (9-10.o)', en: 'C (grades 9–10)' }), v: 'C'},
    { k: t({ hu: 'C+ (9-12.o)', en: 'C+ (grades 9–12)' }), v: 'C+'},
    { k: t({ hu: 'D (9-12.o)', en: 'D (grades 9–12)' }), v: 'D'},
    { k: t({ hu: 'D+ (9-12.o)', en: 'D+ (grades 9–12)' }), v: 'D+'},
    { k: t({ hu: 'E (9-12.o)', en: 'E (grades 9–12)' }), v: 'E'},
    { k: t({ hu: 'E+ (9-12.o)', en: 'E+ (grades 9–12)' }), v: 'E+'},
    { k: '↻', v: '' }
  ];

  return <Listbox
    value={selectedCategories} onChange={setSelectedCategories}
    as="div" multiple horizontal
    className="mb-2 w-md inline-block px-1"
  >
    <label htmlFor="category-selector" className="block">{t({ hu: 'Kategória szűrő:', en: 'Category filter:' })}</label>
    <ListboxButton
      id="category-selector"
      className="border-2 border-slate-600 rounded-sm w-full bg-slate-100"
    >
      {selectedCategories.sort().join(', ') || t({ hu: 'Válassz kategóriákat', en: 'Select categories' })}
    </ListboxButton>
    <OverviewFilterOptions options={allCategories}></OverviewFilterOptions>
  </Listbox>;
};

const YearFilter = ({ selectedYears, setSelectedYears }) => {
  const { t } = useTranslation();
  const allGames = Object.values(gameList);
  const allYears = sortBy(uniqBy(allGames.map(game => game.year), y => y.v), a => a.v);
  allYears.push({ k: '↻', v: '' });

  return <Listbox
    value={selectedYears} onChange={setSelectedYears}
    as="div" multiple horizontal
    className="mb-2 w-md inline-block px-1"
  >
    <label htmlFor="year-selector" className="block">{t({ hu: 'Év szűrő:', en: 'Year filter:' })}</label>
    <ListboxButton
      id="year-selector"
      className="border-2 border-slate-600 rounded-sm w-full bg-slate-100"
    >
      {selectedYears.sort().join(', ') || t({ hu: 'Válassz éveket', en: 'Select years' })}
    </ListboxButton>
    <OverviewFilterOptions options={allYears}></OverviewFilterOptions>
  </Listbox>;
};

const OverviewHeader = () => {
  const { t } = useTranslation();
  return <div className="pb-2"><div className="flex flex-wrap items-baseline">
    <h1 className="text-blue-600 font-bold pb-4 grow">
      {t({ hu: 'Dürer stratégiás játékok', en: 'Dürer Strategy Games' })}
    </h1>
    <span className="text-right flex items-center gap-2">
      <a
        href="https://forms.gle/7DwugmXNrvKgkiiu8"
        target="_blank"
        className="px-4"
      >
        {t({ hu: 'Hibabejelentő', en: 'Bug report' })}
      </a>
      <LanguageSelector />
    </span>
  </div>
  {t({
    hu: <>
      A <i>stratégiás játék</i> egy interaktív két szereplős játék,
      amelyet egy gép ellen játszhattok. Az alábbiakban
      a <a href="https://durerinfo.hu">Dürer Versenyen</a> feladott
      játékokat próbálhatjátok ki. A feladatok fokozatosan nehezednek
      az A kategóriától az E+ kategóriáig.
    </>,
    en: <>
      A <i>strategy game</i> is an interactive two-player game played against a computer.
      Below you can try the games from
      the <a href="https://durerinfo.hu">Dürer Competition</a>.
      The difficulty increases from category A to E+.
    </>
  })}
  </div>;
};

const Game = ({ gameId, gameProps }) => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const hasEnglish = typeof gameProps.name === 'object' && 'en' in gameProps.name;

  const round = gameProps.round === 'döntő'
    ? t({ hu: 'döntő', en: 'final' })
    : gameProps.round;

  return <span
    className="rounded-lg shadow-lg border p-2 m-1 max-w-[32ch] w-full flex flex-col js-game-card"
  >
    <h2 className="font-bold mb-4 text-center">
      {t(gameProps.name)}
      {language === 'en' && hasEnglish && (
        <span className="ml-1 text-sm text-gray-400 align-middle" title="English translation available">🌐</span>
      )}
    </h2>
    <div className="grow"></div>
    <div className="flex flex-wrap items-baseline">
      <span
        className="rounded-lg bg-orange-200 px-1 m-0.5 whitespace-nowrap"
        title={gameProps.year.k}
      >{gameProps.year.v}</span>
      <span
        className="rounded-lg bg-blue-200 px-1 m-0.5 whitespace-nowrap"
      >{gameProps.category.join(', ')}</span>
      <span className="rounded-lg bg-amber-200 px-1 m-0.5">{round}</span>
      <span className="grow"></span>
      <Link
        to={`/game/${gameId}`}
        className="cta-button rounded-lg py-0 px-1 underline m-0.5 text-base w-auto text-black ml-auto"
      >{t({ hu: 'Kipróbálom!', en: 'Try it!' })}</Link>
    </div>
  </span>;
};
