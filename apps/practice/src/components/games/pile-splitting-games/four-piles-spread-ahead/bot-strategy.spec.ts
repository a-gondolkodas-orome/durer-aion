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
      // board[1]=4 (even), board[3]=8 (8%5=3)
      const { pileId, pieceId } = getSmartBotStep([5, 4, 3, 8]);
      expect(pileId).toBe(3);
      expect([0, 1]).toContain(pieceId);
    });

    it('board[1] even, board[3]%5===1: picks a valid pile and valid pieceId', () => {
      // board[1]=4 (even), board[3]=6 (6%5=1)
      const { pileId, pieceId } = getSmartBotStep([5, 4, 3, 6]);
      expect([1, 2, 3]).toContain(pileId);
      expect(pieceId).toBeLessThan(pileId);
    });
  });
});
