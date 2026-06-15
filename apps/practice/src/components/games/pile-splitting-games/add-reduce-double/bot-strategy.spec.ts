import { getSmartBotStep } from './bot-strategy';

describe('add-reduce-double getSmartBotStep', () => {
  describe('unbalanced piles (diff > 1): deterministic', () => {
    it('reduces the larger pile by 2*floor((diff+1)/3)', () => {
      // diff = 10-2=8, third = floor(9/3)=3, pieceCount=6
      expect(getSmartBotStep([10, 2])).toEqual({ pileId: 0, pieceCount: 6 });
    });

    it('selects the correct pile when the second is larger', () => {
      expect(getSmartBotStep([2, 10])).toEqual({ pileId: 1, pieceCount: 6 });
    });

    it('computes pieceCount correctly for a different gap', () => {
      // diff = 8-2=6, third = floor(7/3)=2, pieceCount=4
      expect(getSmartBotStep([8, 2])).toEqual({ pileId: 0, pieceCount: 4 });
    });
  });

  describe('balanced piles (diff <= 1): constrained random', () => {
    it('always picks the only movable pile when the other has size 1', () => {
      // [1, 2]: both balanced (diff=-1); board[ran=0]=1 not >1, so pileId forced to 1
      // pieceCount = 2*random(1, 2/2)=2*random(1,1)=2
      expect(getSmartBotStep([1, 2])).toEqual({ pileId: 1, pieceCount: 2 });
    });

    it('always picks the only movable pile when the other has size 1 (swapped)', () => {
      expect(getSmartBotStep([2, 1])).toEqual({ pileId: 0, pieceCount: 2 });
    });

    it('returns a valid even pieceCount from either pile when both are large', () => {
      const { pileId, pieceCount } = getSmartBotStep([4, 4]);
      expect([0, 1]).toContain(pileId);
      expect([2, 4]).toContain(pieceCount);
    });
  });
});
