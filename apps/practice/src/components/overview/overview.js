import React, { useState } from 'react';
import { gameList } from '../games/gameList';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/react';
import { uniq, every } from 'lodash';
import { Link } from 'react-router-dom';

export const Overview = () => {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);

  const shouldShow = game => {
    if (selectedCategories.length > 0 && every(game.category, c => !selectedCategories.includes(c))) return false;
    if (selectedYears.length > 0 && !selectedYears.includes(game.year)) return false;
    return true;
  };

  // order by year and then by category regardless of order in gameList.js
  const gamesToShow = Object.keys(gameList)
    .filter(id => shouldShow(gameList[id]))
    .sort((a, b) =>
      gameList[a].category[0] > gameList[b].category[0]
      ? 1
      : (gameList[a].category[0] < gameList[b].category[0] ? -1 : 0)
    )
    .sort((a, b) => gameList[a].year - gameList[b].year);

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
    <div className="flex flex-wrap">
      {gamesToShow.map(id => Game(id, gameList[id]))}
    </div>
  </main>;
};

const OverviewFilterOptions = ({ options }) => {
  return <ListboxOptions
    className="text-center py-2 w-[var(--button-width)] shadow-xl bg-slate-100"
    anchor="bottom"
  >
    {options.map(option =>
      <ListboxOption
        key={option}
        value={option}
        className="inline-block"
      >{({ focus, selected }) =>
        <span className={`
          border-2 rounded px-1 m-1 inline-block
          ${selected ? 'bg-blue-200' : 'bg-white'}
          ${focus ? 'outline' : ''}
        `}>
          <span className={selected ? '' : 'text-transparent'}>✓</span>{option}
        </span>
      }</ListboxOption>
    )}
  </ListboxOptions>;
};

const CategoryFilter = ({ selectedCategories, setSelectedCategories }) => {
  const allCategories = ['A', 'B', 'C', 'C+', 'D', 'D+', 'E', 'E+'];

  return <Listbox
    value={selectedCategories} onChange={setSelectedCategories}
    as="div" multiple horizontal
    className="mb-2 w-[28rem] inline-block px-1"
  >
    <label htmlFor="category-selector" className="block">Kategória szűrő:</label>
    <ListboxButton
      id="category-selector"
      className="border-2 border-slate-600 rounded w-full bg-slate-100"
    >
      {selectedCategories.sort().join(', ') || 'Válassz kategóriákat'}
    </ListboxButton>
    <OverviewFilterOptions options={allCategories}></OverviewFilterOptions>
  </Listbox>;
};

const YearFilter = ({ selectedYears, setSelectedYears }) => {
  const allGames = Object.values(gameList);
  const allYears = uniq(allGames.map(game => game.year)).sort((a, b) => Number(a) - Number(b));

  return <Listbox
    value={selectedYears} onChange={setSelectedYears}
    as="div" multiple horizontal
    className="mb-2 w-[28rem] inline-block px-1"
  >
    <label htmlFor="year-selector" className="block">Év szűrő:</label>
    <ListboxButton
      id="year-selector"
      className="border-2 border-slate-600 rounded w-full bg-slate-100"
    >
      {selectedYears.sort((a, b) => Number(a) - Number(b)).join(', ') || 'Válassz éveket'}
    </ListboxButton>
    <OverviewFilterOptions options={allYears}></OverviewFilterOptions>
  </Listbox>;
};

const OverviewHeader = () => {
  return <div className="flex flex-wrap items-baseline">
    <h1 className="text-blue-600 font-bold pb-4 grow">Dürer játékok</h1>
    <span className="text-right">
      <a
        href="https://forms.gle/7DwugmXNrvKgkiiu8"
        target="_blank"
        className="px-4"
      >
        Hibabejelentő
      </a>
    </span>
  </div>;
};

const Game = (gameId, gameProps) => {
  return <span
    key={gameId}
    className="rounded-lg shadow-lg border p-2 m-1 max-w-[32ch] w-full flex flex-col js-game-card"
  >
    <h2 className="font-bold mb-4 text-center">{gameProps.name}</h2>
    <div className="grow"></div>
    <div className="flex items-baseline">
      <span className="rounded-lg bg-orange-200 px-1 m-0.5">{gameProps.year}.</span>
      <span className="rounded-lg bg-blue-200 px-1 m-0.5">{gameProps.category.join(', ')}</span>
      <span className="rounded-lg bg-amber-200 px-1 m-0.5">{gameProps.round}</span>
      <span className="grow"></span>
      <Link
        to={`/game/${gameId}`}
        className="cta-button rounded-lg py-0 px-1 underline m-0.5 text-base w-auto text-black"
      >Kipróbálom!</Link>
    </div>
  </span>;
};
