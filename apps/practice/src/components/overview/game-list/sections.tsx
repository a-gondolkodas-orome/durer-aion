import { orderBy } from 'lodash';
import { gameList, type Category, type GameList } from '../../games/gameList';
import type { I18nNode } from '../../../language';
import { CollapsibleSection } from './collapsible-section';
import { GameCard } from './game-card';

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

// Ids ordered the way cards should appear: by category (A → E+), then by year
// descending within a category. Used for both the featured strip and sections.
export const orderByCategoryThenYear = (ids: string[], list: GameList): string[] =>
  orderBy(
    ids,
    [id => list[id].category[0], id => list[id].year.v],
    ['asc', 'desc']
  );

// The curated "Start here" strip at the top of the overview — collapsible like
// the catalog sections, but open by default so it's the visible highlight on
// landing. `gameIds` are already filtered/ordered by the caller; when empty
// (e.g. an active category filter excludes them all) the strip is hidden.
export const FeaturedStrip = ({ gameIds }: { gameIds: string[] }) => {
  if (gameIds.length === 0) return null;

  return (
    <CollapsibleSection
      title={{ hu: 'Kiemelt játékok', en: 'Featured games' }}
      defaultOpen={true}
      storageKey="featured"
      dataTestid="featured-strip"
    >
      <div className="flex flex-wrap gap-2 sm:gap-4 justify-center">
        {gameIds.map(id => <GameCard key={id} gameId={id} gameProps={gameList[id]} />)}
      </div>
    </CollapsibleSection>
  );
};

export const CategorySection = ({ title, gameIds, defaultOpen, forceOpen, storageKey }: {
  title: I18nNode
  gameIds: string[]
  defaultOpen: boolean
  forceOpen: boolean
  storageKey: string
}) => {
  if (gameIds.length === 0) return null;

  return (
    <CollapsibleSection
      title={title}
      defaultOpen={defaultOpen}
      forceOpen={forceOpen}
      storageKey={storageKey}
      trailing={<span className="text-sm">({gameIds.length})</span>}
    >
      <div className="flex flex-wrap gap-2 sm:gap-4 justify-center">
        {gameIds.map(id => <GameCard key={id} gameId={id} gameProps={gameList[id]} />)}
      </div>
    </CollapsibleSection>
  );
};
