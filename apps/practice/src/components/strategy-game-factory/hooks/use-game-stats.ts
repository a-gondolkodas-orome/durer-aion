import { useState, useCallback } from 'react';

export interface Stats { win: number; loss: number }

const EMPTY_STATS: Stats = { win: 0, loss: 0 };

const readStats = (key: string): Stats => {
  try {
    return JSON.parse(localStorage.getItem(key)!) ?? EMPTY_STATS;
  } catch {
    return EMPTY_STATS;
  }
};

// Keyed by the variant's key, the same one the URL and the analytics event use
// — an index would silently hand a variant the tally of whichever one used to
// sit at its position the next time a game's variants are reordered.
export const useGameStats = (gameId: string, variantKey: string) => {
  const storageKey = `stats_${gameId}_${variantKey}`;

  // Stamped with the key it was read for, the same shape as
  // useMoveScopedState: switching variant reads the new key during render, so
  // the previous variant's counts are never shown for a frame. An effect
  // re-reading on `storageKey` would repair it one render too late.
  const [stored, setStored] = useState(() => ({ key: storageKey, stats: readStats(storageKey) }));
  const stats = stored.key === storageKey ? stored.stats : readStats(storageKey);

  const recordResult = useCallback((result: keyof Stats) => {
    setStored(stale => {
      const current = stale.key === storageKey ? stale.stats : readStats(storageKey);
      const next = { ...current, [result]: current[result] + 1 };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return { key: storageKey, stats: next };
    });
  }, [storageKey]);

  const resetStats = useCallback(() => {
    localStorage.removeItem(storageKey);
    setStored({ key: storageKey, stats: EMPTY_STATS });
  }, [storageKey]);

  return { stats, recordResult, resetStats };
};
