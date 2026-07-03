import { gameList } from '../games/gameList';
import { CollapsibleSection } from './collapsible-section';
import { GameCard } from './game-card';

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
