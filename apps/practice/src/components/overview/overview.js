import React, { useState } from 'react';
import { gameList } from '../games/gameList';
import { every, orderBy } from 'lodash';
import { Link } from 'react-router';
import { useTranslation } from '../language/translate';
import { LanguageSelector } from '../language/language-selector';

export const Overview = () => {
  const { t } = useTranslation();
  const [selectedCategories, setSelectedCategories] = useState([]);

  const shouldShow = game => {
    const noCategoryMatch = selectedCategories.length > 0
      && every(game.category, c => !selectedCategories.includes(c));
    if (noCategoryMatch) return false;
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
    <div className="flex flex-wrap items-center gap-1 mb-2">
      <CategoryFilter selected={selectedCategories} onChange={setSelectedCategories} />
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

const CategoryFilter = ({ selected, onChange }) => {
  const { t } = useTranslation();
  const categories = [
    { k: 'A', v: 'A' }, { k: 'B', v: 'B' },
    { k: 'C', v: 'C' }, { k: 'D', v: 'D' },
    { k: 'E', v: 'E' }, { k: 'E+', v: 'E+' }
  ];
  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="text-sm">{t({ hu: 'Kategória:', en: 'Category:' })}</span>
      {categories.map(({ k, v }) => {
        const isSelected = selected.includes(v);
        return (
          <button
            key={v}
            onClick={() => onChange(isSelected ? selected.filter(s => s !== v) : [...selected, v])}
            className={`rounded-lg px-2 py-0.5 border text-sm cursor-pointer
              ${isSelected ? 'bg-blue-200 border-blue-400' : 'bg-white border-slate-300'}`}
          >{k}</button>
        );
      })}
      <button
        onClick={() => onChange([])}
        disabled={selected.length === 0}
        className={`rounded-lg px-2 py-0.5 border border-slate-300 bg-white text-sm
          text-gray-400 cursor-pointer disabled:opacity-0 disabled:cursor-default`}
      >×</button>
    </div>
  );
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

const categoryColorClass = {
  'A':  'bg-emerald-200 border-emerald-400 text-emerald-950',
  'B':  'bg-teal-300 border-teal-500 text-teal-950',
  'C':  'bg-blue-300 border-blue-400 text-blue-950',
  'D':  'bg-blue-400 border-blue-500 text-blue-950',
  'E':  'bg-blue-600 border-blue-700 text-white',
  'E+': 'bg-blue-800 border-blue-900 text-white'
};

const chipBase = 'rounded-full border px-2 py-0.5 text-xs whitespace-nowrap';
const neutralChip = `${chipBase} border-slate-300 bg-white text-slate-800`;

const Game = ({ gameId, gameProps }) => {
  const { t } = useTranslation();

  const round = gameProps.round === 'döntő'
    ? t({ hu: 'döntő', en: 'final' })
    : gameProps.round;

  const categoryColor = categoryColorClass[gameProps.category[0]] ?? neutralChip;

  return <Link
    to={`/game/${gameId}`}
    className={
      'rounded-lg shadow-sm border p-2 m-2 max-w-[32ch] w-full flex flex-col js-game-card ' +
      'cursor-pointer hover:shadow-md hover:border-blue-400 transition-shadow no-underline text-inherit'
    }
  >
    <h2 className="font-bold mb-4 text-center">
      {t(gameProps.name)}
    </h2>
    <div className="grow"></div>
    <div className="flex flex-wrap items-baseline gap-1">
      <span className={neutralChip} title={gameProps.year.k}>{gameProps.year.v}</span>
      <span className={`${chipBase} ${categoryColor}`}>{gameProps.category.join(', ')}</span>
      <span className={neutralChip}>{round}</span>
      <span className="grow"></span>
      <span className="text-slate-400 text-sm">→</span>
    </div>
  </Link>;
};
