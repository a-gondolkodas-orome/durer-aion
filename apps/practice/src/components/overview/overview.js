import React, { useState } from 'react';
import { gameList } from '../games/gameList';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/react';
import { uniqBy, every, sortBy, orderBy } from 'lodash';
import { Link } from 'react-router';

export const Overview = () => {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);

  if (selectedCategories.includes('')) {
    setSelectedCategories([]);
  }
  if (selectedYears.includes('')) {
    setSelectedYears([]);
  }

  const shouldShow = game => {
    if (selectedCategories.length > 0 && !selectedCategories.includes('') && every(game.category, c => !selectedCategories.includes(c))) return false;
    if (selectedYears.length > 0 && !selectedYears.includes('') && !selectedYears.includes(game.year.v)) return false;
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
    <div className="flex flex-wrap align-baseline">
      <CategoryFilter
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
      ></CategoryFilter>
      <YearFilter
        selectedYears={selectedYears}
        setSelectedYears={setSelectedYears}
      ></YearFilter>
    </div>
    <h2 className="font-bold my-4 text-center">5-8. osztályosoknak (A-B kategória)</h2>
    <div className="flex flex-wrap justify-center">
      {gamesToShow.filter(id => gameList[id].category[0] <= "B").map(id => Game(id, gameList[id]))}
    </div>
    <h2 className="font-bold my-4 text-center">9-12. osztályosoknak (C-D-E kategória)</h2>
    <div className="flex flex-wrap justify-center">
      {gamesToShow.filter(id => gameList[id].category[0] > "B").map(id => Game(id, gameList[id]))}
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
  const allCategories = [
    { k: 'A (5-6.o)', v: 'A'},
    { k: 'B (7-8.o)', v: 'B'},
    { k: 'C (9-10.o)', v: 'C'},
    { k: 'C+ (9-12.o)', v: 'C+'},
    { k: 'D (9-12.o)', v: 'D'},
    { k: 'D+ (9-12.o)', v: 'D+'},
    { k: 'E (9-12.o)', v: 'E'},
    { k: 'E+ (9-12.o)', v: 'E+'},
    { k: '↻', v: '' }
  ];

  return <Listbox
    value={selectedCategories} onChange={setSelectedCategories}
    as="div" multiple horizontal
    className="mb-2 w-md inline-block px-1"
  >
    <label htmlFor="category-selector" className="block">Kategória szűrő:</label>
    <ListboxButton
      id="category-selector"
      className="border-2 border-slate-600 rounded-sm w-full bg-slate-100"
    >
      {selectedCategories.sort().join(', ') || 'Válassz kategóriákat'}
    </ListboxButton>
    <OverviewFilterOptions options={allCategories}></OverviewFilterOptions>
  </Listbox>;
};

const YearFilter = ({ selectedYears, setSelectedYears }) => {
  const allGames = Object.values(gameList);
  const allYears = sortBy(uniqBy(allGames.map(game => game.year), y => y.v), a => a.v);
  allYears.push({ k: '↻', v: '' });

  return <Listbox
    value={selectedYears} onChange={setSelectedYears}
    as="div" multiple horizontal
    className="mb-2 w-md inline-block px-1"
  >
    <label htmlFor="year-selector" className="block">Év szűrő:</label>
    <ListboxButton
      id="year-selector"
      className="border-2 border-slate-600 rounded-sm w-full bg-slate-100"
    >
      {selectedYears.sort().join(', ') || 'Válassz éveket'}
    </ListboxButton>
    <OverviewFilterOptions options={allYears}></OverviewFilterOptions>
  </Listbox>;
};

const OverviewHeader = () => {
  return <div className="pb-2"><div className="flex flex-wrap items-baseline">
    <h1 className="text-blue-600 font-bold pb-4 grow">Dürer stratégiás játékok</h1>
    <span className="text-right">
      <a
        href="https://forms.gle/7DwugmXNrvKgkiiu8"
        target="_blank"
        className="px-4"
      >
        Hibabejelentő
      </a>
    </span>
  </div>
  A <i>stratégiás játék</i> egy interaktív két szereplős játék, amelyet egy gép ellen játszhattok. Az alábbiakban a <a href="https://durerinfo.hu">Dürer Versenyen</a> feladott játékokat próbálhatjátok ki. A feladatok fokozatosan nehezednek az A kategóriától az E+ kategóriáig.
  </div>;
};

const Game = (gameId, gameProps) => {
  return <span
    key={gameId}
    className="rounded-lg shadow-lg border p-2 m-1 max-w-[32ch] w-full flex flex-col js-game-card"
  >
    <h2 className="font-bold mb-4 text-center">{gameProps.name}</h2>
    <div className="grow"></div>
    <div className="flex flex-wrap items-baseline">
      <span
        className="rounded-lg bg-orange-200 px-1 m-0.5 whitespace-nowrap"
        title={gameProps.year.k}
      >{gameProps.year.v}</span>
      <span
        className="rounded-lg bg-blue-200 px-1 m-0.5 whitespace-nowrap"
      >{gameProps.category.join(', ')}</span>
      <span className="rounded-lg bg-amber-200 px-1 m-0.5">{gameProps.round}</span>
      <span className="grow"></span>
      <Link
        to={`/game/${gameId}`}
        className="cta-button rounded-lg py-0 px-1 underline m-0.5 text-base w-auto text-black ml-auto"
      >Kipróbálom!</Link>
    </div>
  </span>;
};
