import { every, orderBy } from 'lodash';
import type { Category, GameList } from '../games/gameList';

// The overview groups games into two broad brackets rather than one section per
// category. Age categories are soft (an A-category student may well enjoy a B
// game), and a single bracket that spans C–E+ means a game tagged with several
// categories (e.g. C, D, E) sits in one place that already covers all of them,
// instead of being confusingly split across many sections.
export type SectionKey = 'AB' | 'CDE';

export const sectionOrder: SectionKey[] = ['AB', 'CDE'];

// Sections open by default (before any filtering). Both start collapsed so the
// landing shows only the curated featured strip; the full catalog sits behind
// the two accordions.
export const defaultOpenSections: SectionKey[] = [];

// A game is placed by its primary (lowest / easiest) category.
export const sectionKeyOf = (category: Category): SectionKey =>
  category <= 'B' ? 'AB' : 'CDE';

// Ids of the featured games (display order is applied separately by the caller).
export const getFeaturedGames = (list: GameList): string[] =>
  Object.keys(list).filter(id => list[id].featured);

export const groupBySection = (
  ids: string[],
  list: GameList
): Record<SectionKey, string[]> => {
  const groups: Record<SectionKey, string[]> = { AB: [], CDE: [] };
  ids.forEach(id => groups[sectionKeyOf(list[id].category[0])].push(id));
  return groups;
};

// Keep only games matching at least one of the selected categories. An empty
// selection matches everything. Mirrors the previous `shouldShow` semantics.
export const filterByCategories = (
  ids: string[],
  selected: Category[],
  list: GameList
): string[] => {
  if (selected.length === 0) return ids;
  return ids.filter(id =>
    !every(list[id].category, c => !selected.includes(c))
  );
};

// Ids ordered the way cards should appear: by category (A → E+), then by year
// descending within a category. Used for both the featured strip and sections.
export const orderByCategoryThenYear = (ids: string[], list: GameList): string[] =>
  orderBy(
    ids,
    [id => list[id].category[0], id => list[id].year.v],
    ['asc', 'desc']
  );
