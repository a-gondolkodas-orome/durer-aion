import {
  getUsedIcons, filterByCategories, filterByIcons, getUsedYears, filterByYears, filterByRounds,
  yearRangeLabels
} from './filters';
import type { GameList } from '../../games/gameList';

const list: GameList = {
  EasyA: {
    category: ['A'], year: { k: '', v: '11/12' }, round: 'döntő', featured: true, icon: 'chess'
  },
  EasyB: { category: ['B'], year: { k: '', v: '12/13' }, round: 'döntő', icon: 'coins' },
  MidCD: {
    category: ['C', 'D'], year: { k: '', v: '20/21' }, round: 'döntő', featured: true, icon: 'coins'
  },
  HardE: { category: ['E', 'E+'], year: { k: '', v: '22/23' }, round: 'online', icon: 'number' }
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

describe('year and round filters', () => {
  const ids = Object.keys(list);

  it('lists each used year once, oldest first', () => {
    const shuffled = { HardE: list.HardE, EasyA: list.EasyA, MidCD: list.MidCD, EasyB: list.EasyB, Again: list.EasyB };
    expect(getUsedYears(shuffled)).toEqual(['11/12', '12/13', '20/21', '22/23']);
  });

  it('keeps the games of an inclusive range of years', () => {
    expect(filterByYears(ids, null, list)).toEqual(ids);
    expect(filterByYears(ids, ['12/13', '20/21'], list)).toEqual(['EasyB', 'MidCD']);
    expect(filterByYears(ids, ['13/14', '19/20'], list)).toEqual([]);
  });

  describe('yearRangeLabels', () => {
    const years = ['07/08', '08/09', '09/10', '10/11', '11/12', '12/13', '13/14', '14/15', '15/16', '16/17', '17/18'];

    it('labels each end of the range where its thumb is', () => {
      expect(yearRangeLabels(years, 0, 10)).toEqual([{ at: 0, text: '07/08' }, { at: 1, text: '17/18' }]);
      expect(yearRangeLabels(years, 3, 8)).toEqual([{ at: 0.3, text: '10/11' }, { at: 0.8, text: '15/16' }]);
    });

    it('merges the two into one label between the thumbs once they are too close to read apart', () => {
      expect(yearRangeLabels(years, 4, 5)).toEqual([{ at: 0.45, text: '11/12 – 12/13' }]);
      expect(yearRangeLabels(years, 4, 6)).toEqual([{ at: 0.4, text: '11/12' }, { at: 0.6, text: '13/14' }]);
    });

    it('names a single year once', () => {
      expect(yearRangeLabels(years, 6, 6)).toEqual([{ at: 0.6, text: '13/14' }]);
    });
  });

  it('filters by round', () => {
    expect(filterByRounds(ids, ['online'], list)).toEqual(['HardE']);
    expect(filterByRounds(ids, ['döntő'], list)).toEqual(['EasyA', 'EasyB', 'MidCD']);
  });
});
