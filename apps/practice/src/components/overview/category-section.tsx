import { gameList } from '../games/gameList';
import type { I18nNode } from '../language';
import { CollapsibleSection } from './collapsible-section';
import { GameCard } from './game-card';

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
