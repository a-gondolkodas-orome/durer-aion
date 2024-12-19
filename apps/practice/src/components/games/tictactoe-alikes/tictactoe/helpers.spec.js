import { inPlacingPhase } from "./helpers";

describe('helpers', () => {
  describe('inPlacingPhase', () => {
    it('should return true if board has empty place', () => {
      expect(inPlacingPhase([null, 'blue', 'red', 'red', 'red', 'blue', 'blue', 'blue', 'red'])).toBe(true);
    });

    it('should return false if board does not have empty place', () => {
      expect(inPlacingPhase(['blue', 'red', 'red', 'white', 'red', 'white', 'blue', 'blue', 'white'])).toBe(false);
    });
  });
});
