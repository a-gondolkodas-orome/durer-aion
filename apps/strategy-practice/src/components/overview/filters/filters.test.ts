import { getUsedIcons, filterByCategories, filterByIcons } from './filters';
import type { GameList } from '../../games/gameList';

const list: GameList = {
  EasyA: {
    name: { hu: 'A' }, category: ['A'], year: { k: '', v: '11/12' }, round: 'döntő', featured: true, icon: 'chess'
  },
  EasyB: { name: { hu: 'B' }, category: ['B'], year: { k: '', v: '12/13' }, round: 'döntő', icon: 'coins' },
  MidCD: {
    name: { hu: 'CD' }, category: ['C', 'D'], year: { k: '', v: '20/21' }, round: 'döntő', featured: true, icon: 'coins'
  },
  HardE: { name: { hu: 'E' }, category: ['E', 'E+'], year: { k: '', v: '22/23' }, round: 'online', icon: 'number' }
};

describe('filterByCategories', () => {
  const ids = Object.keys(list);

  it('returns everything for an empty selection', () => {
    expect(filterByCategories(ids, [], list)).toEqual(ids);
  });

  it('matches games sharing any selected category', () => {
    // D is a secondary category of MidCD, so MidCD matches
    expect(filterByCategories(ids, ['D'], list)).toEqual(['MidCD']);
    expect(filterByCategories(ids, ['A', 'E+'], list)).toEqual(['EasyA', 'HardE']);
  });
});

describe('getUsedIcons', () => {
  it('returns the distinct icons in canonical order, ignoring unused keys', () => {
    // used icons: chess, coins (twice), number — canonical order is chess, coins, number
    expect(getUsedIcons(list)).toEqual(['chess', 'coins', 'number']);
  });
});

describe('filterByIcons', () => {
  const ids = Object.keys(list);

  it('returns everything for an empty selection', () => {
    expect(filterByIcons(ids, [], list)).toEqual(ids);
  });

  it('keeps only games whose icon is selected', () => {
    expect(filterByIcons(ids, ['coins'], list)).toEqual(['EasyB', 'MidCD']);
    expect(filterByIcons(ids, ['chess', 'coins'], list)).toEqual(['EasyA', 'EasyB', 'MidCD']);
    expect(filterByIcons(ids, ['chess'], list)).toEqual(['EasyA']);
  });
});
