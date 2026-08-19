import { describe, expect, it } from 'vitest';
import { strategyV2Games } from './strategy-v2-games';

describe('the v2 game registry', () => {
  it('covers exactly the categories the competition runs', () => {
    expect(Object.keys(strategyV2Games).sort()).toEqual(['C', 'D', 'E']);
    expect(strategyV2Games.C?.gameId).toBe('RemoveDivisorMultiple');
    expect(strategyV2Games.D?.gameId).toBe('RemoveDivisorMultiple');
    expect(strategyV2Games.E?.gameId).toBe('StonesRemoveOneNotTwiceFromLeft');
  });

  it("every category's game deals live boards for that category, in pairs", () => {
    for (const [category, game] of Object.entries(strategyV2Games)) {
      const boards = game.liveStartBoardsByCategory[category];
      expect(boards, `${game.gameId} lacks live boards for ${category}`).toBeDefined();
      // startBoardIndexForTally reads loss-indexed pairs; an odd list is a
      // registration mistake this catches before a competition does.
      expect((boards ?? []).length % 2).toBe(0);
      expect((boards ?? []).length).toBeGreaterThan(0);
    }
  });
});
