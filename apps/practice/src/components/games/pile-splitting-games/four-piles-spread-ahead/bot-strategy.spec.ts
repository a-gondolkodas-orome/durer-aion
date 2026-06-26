import { getSmartBotStep } from './bot-strategy';

describe('four-piles-spread-ahead getSmartBotStep', () => {
  describe('deterministic branches', () => {
    it('board[1] even, board[3]%5===4: always spreads 3 from pile 3', () => {
      // board[1]=4 (even), board[3]=9 (9%5=4)
      expect(getSmartBotStep([5, 4, 3, 9])).toEqual({ pileId: 3, pieceId: 2 });
    });

    it('board[1] odd, board[3]%5===3: always spreads 3 from pile 3', () => {
      // board[1]=3 (odd), board[3]=8 (8%5=3)
      expect(getSmartBotStep([5, 3, 3, 8])).toEqual({ pileId: 3, pieceId: 2 });
    });

    it('board[1] odd, board[3]%5===4: always spreads 2 from pile 3', () => {
      // board[1]=3 (odd), board[3]=9 (9%5=4)
      expect(getSmartBotStep([5, 3, 3, 9])).toEqual({ pileId: 3, pieceId: 1 });
    });
  });

  describe('constrained random branches', () => {
    it('board[1] even, board[3]%5===3: always uses pile 3, spreads 1 or 2', () => {
      // board[1]=4 (even), board[3]=8 (8%5=3). pieceId is random(0,1): assert it
      // always stays in {0,1} and that both outcomes actually occur over many draws.
      const seen = new Set<number>();
      for (let i = 0; i < 50; i++) {
        const { pileId, pieceId } = getSmartBotStep([5, 4, 3, 8]);
        expect(pileId).toBe(3);
        expect([0, 1]).toContain(pieceId);
        seen.add(pieceId);
      }
      expect(seen).toEqual(new Set([0, 1]));
    });

    it('board[1] even, board[3]%5===1: picks a valid pile and valid pieceId', () => {
      // board[1]=4 (even), board[3]=6 (6%5=1). Over many draws every pile must be a
      // real, non-empty pile (1..3, never the protected pile 0) with pieceId < pileId.
      // Strategy detail: only pile 2 may spread 2 (pieceId 1); piles 1 and 3 must
      // always spread exactly 1 (pieceId 0). Pile 2 must produce both 0 and 1.
      const pile2PieceIds = new Set<number>();
      for (let i = 0; i < 100; i++) {
        const { pileId, pieceId } = getSmartBotStep([5, 4, 3, 6]);
        expect([1, 2, 3]).toContain(pileId);
        expect(pieceId).toBeGreaterThanOrEqual(0);
        expect(pieceId).toBeLessThan(pileId);
        if (pileId === 1 || pileId === 3) expect(pieceId).toBe(0);
        if (pileId === 2) pile2PieceIds.add(pieceId);
      }
      expect(pile2PieceIds).toEqual(new Set([0, 1]));
    });
  });
});
