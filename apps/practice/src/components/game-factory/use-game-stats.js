import { useState, useEffect, useCallback } from 'react';

const EMPTY_STATS = { win: 0, loss: 0 };

const readStats = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? EMPTY_STATS;
  } catch {
    return EMPTY_STATS;
  }
};

export const useGameStats = (gameId, variantIndex) => {
  const storageKey = `stats_${gameId}_${variantIndex}`;

  const [stats, setStats] = useState(() => readStats(storageKey));

  useEffect(() => {
    setStats(readStats(storageKey));
  }, [storageKey]);

  const recordResult = useCallback((result) => {
    setStats(prev => {
      const next = { ...prev, [result]: prev[result] + 1 };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [storageKey]);

  const resetStats = useCallback(() => {
    localStorage.removeItem(storageKey);
    setStats(EMPTY_STATS);
  }, [storageKey]);

  return { stats, recordResult, resetStats };
};
