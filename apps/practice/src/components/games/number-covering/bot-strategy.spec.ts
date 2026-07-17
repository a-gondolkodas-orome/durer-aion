import { getOptimalSmartBotMove, COVERED } from './number-covering';

// 1..8 with 7 covered -> 4 evens (2,4,6,8) and 3 odds (1,3,5) remain.
const fourEvensThreeOdds = [1, 2, 3, 4, 5, 6, COVERED, 8];
// 1..8 with 6 and 8 covered -> 2 evens (2,4) and 4 odds (1,3,5,7) remain.
const twoEvensFourOdds = [1, 2, 3, 4, 5, COVERED, 7, COVERED];

describe('number covering smart bot', () => {
  it('as first player covers from the smaller parity class', () => {
    // odds are the minority -> covers an odd
    expect([1, 3, 5]).toContain(getOptimalSmartBotMove({ board: fourEvensThreeOdds, currentPlayer: 0 }));
    // evens are the minority -> covers an even
    expect([2, 4]).toContain(getOptimalSmartBotMove({ board: twoEvensFourOdds, currentPlayer: 0 }));
  });

  it('as second player covers from the larger parity class', () => {
    // evens are the majority -> covers an even
    expect([2, 4, 6, 8]).toContain(getOptimalSmartBotMove({ board: fourEvensThreeOdds, currentPlayer: 1 }));
    // odds are the majority -> covers an odd
    expect([1, 3, 5, 7]).toContain(getOptimalSmartBotMove({ board: twoEvensFourOdds, currentPlayer: 1 }));
  });

  it('plays a legal move when the parities are balanced', () => {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8]; // 4 evens, 4 odds
    expect(numbers).toContain(getOptimalSmartBotMove({ board: numbers, currentPlayer: 0 }));
    expect(numbers).toContain(getOptimalSmartBotMove({ board: numbers, currentPlayer: 1 }));
  });
});
