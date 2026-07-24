import { getFeaturedGames, sectionKeyOf, groupBySection, orderByCategoryThenYear } from './sections';
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

describe('getFeaturedGames', () => {
  it('returns only the featured ids', () => {
    expect(getFeaturedGames(list)).toEqual(['EasyA', 'MidCD']);
  });

  it('returns an empty array when nothing is featured', () => {
    expect(getFeaturedGames({ EasyB: list.EasyB })).toEqual([]);
  });
});

describe('sectionKeyOf', () => {
  it('puts A and B in the AB bracket', () => {
    expect(sectionKeyOf('A')).toBe('AB');
    expect(sectionKeyOf('B')).toBe('AB');
  });

  it('puts C through E+ in the CDE bracket', () => {
    expect(sectionKeyOf('C')).toBe('CDE');
    expect(sectionKeyOf('D')).toBe('CDE');
    expect(sectionKeyOf('E')).toBe('CDE');
    expect(sectionKeyOf('E+')).toBe('CDE');
  });
});

describe('groupBySection', () => {
  it('groups by the primary category into two brackets', () => {
    const groups = groupBySection(Object.keys(list), list);
    expect(groups.AB).toEqual(['EasyA', 'EasyB']);
    // multi-category games (['C','D'], ['E','E+']) both land in the single CDE bracket
    expect(groups.CDE).toEqual(['MidCD', 'HardE']);
  });
});

describe('orderByCategoryThenYear', () => {
  it('orders by category first, then year descending', () => {
    expect(orderByCategoryThenYear(Object.keys(list), list))
      .toEqual(['EasyA', 'EasyB', 'MidCD', 'HardE']);
  });

  it('orders newest-first within the same category', () => {
    const l: typeof list = {
      A1: { name: { hu: 'A1' }, category: ['A'], year: { k: '', v: '11/12' }, round: 'döntő', icon: 'chess' },
      A2: { name: { hu: 'A2' }, category: ['A'], year: { k: '', v: '20/21' }, round: 'döntő', icon: 'chess' },
      B1: { name: { hu: 'B1' }, category: ['B'], year: { k: '', v: '15/16' }, round: 'döntő', icon: 'chess' }
    };
    expect(orderByCategoryThenYear(['A1', 'B1', 'A2'], l)).toEqual(['A2', 'A1', 'B1']);
  });
});
