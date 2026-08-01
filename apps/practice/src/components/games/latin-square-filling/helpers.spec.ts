import {
  type Board,
  type Move,
  generateStartBoard,
  isFull,
  isLegalPlacement,
  legalDigits,
  legalMoves,
  applyMove,
  playerToMove,
  isTerminal,
  optimalWinner,
  getSmartBotStep,
  getRandomBotStep
} from './helpers';

// Play a full game between two step functions, returning the winner index.
const playGame = (
  step0: (b: Board) => Move,
  step1: (b: Board) => Move,
  start: Board = generateStartBoard()
): number => {
  let board = start;
  // safety bound: at most 9 placements
  for (let i = 0; i < 20; i++) {
    if (isFull(board)) return 0; // grid filled -> first player won
    const moves = legalMoves(board);
    if (moves.length === 0) return 1; // player to move stuck -> second player won
    const step = playerToMove(board) === 0 ? step0 : step1;
    board = applyMove(board, step(board));
  }
  throw new Error('game did not terminate');
};

describe('latin-square-filling helpers', () => {
  describe('legality', () => {
    it('rejects a digit already present in the same row', () => {
      const board: Board = [1, 0, 0, 0, 0, 0, 0, 0, 0];
      expect(isLegalPlacement(board, 1, 1)).toBe(false);
      expect(isLegalPlacement(board, 2, 1)).toBe(false);
      expect(isLegalPlacement(board, 1, 2)).toBe(true);
    });

    it('rejects a digit already present in the same column', () => {
      const board: Board = [1, 0, 0, 0, 0, 0, 0, 0, 0];
      expect(isLegalPlacement(board, 3, 1)).toBe(false);
      expect(isLegalPlacement(board, 6, 1)).toBe(false);
      expect(isLegalPlacement(board, 3, 3)).toBe(true);
    });

    it('rejects writing into an occupied cell', () => {
      const board: Board = [1, 0, 0, 0, 0, 0, 0, 0, 0];
      expect(isLegalPlacement(board, 0, 2)).toBe(false);
    });

    it('legalDigits lists exactly the placeable digits for a cell', () => {
      // centre cell shares row with a 1 and column with a 2 -> only 3 fits
      const board: Board = [0, 2, 0, 1, 0, 0, 0, 0, 0];
      expect(legalDigits(board, 4)).toEqual([3]);
    });

    it('a cell can become dead (no legal digit) while others remain open', () => {
      // cell 4 shares its row with {1,2} and its column with {3} -> nothing fits
      const board: Board = [0, 3, 0, 1, 0, 2, 0, 0, 0];
      expect(legalDigits(board, 4)).toEqual([]);
      // the position is not terminal: other cells still accept digits
      expect(isTerminal(board)).toBe(false);
    });
  });

  describe('turn bookkeeping', () => {
    it('player 0 moves on even fill counts, player 1 on odd', () => {
      expect(playerToMove(generateStartBoard())).toBe(0);
      expect(playerToMove([1, 0, 0, 0, 0, 0, 0, 0, 0])).toBe(1);
      expect(playerToMove([1, 2, 0, 0, 0, 0, 0, 0, 0])).toBe(0);
    });

    it('a completed Latin square is full and terminal', () => {
      const solved: Board = [1, 2, 3, 2, 3, 1, 3, 1, 2];
      expect(isFull(solved)).toBe(true);
      expect(isTerminal(solved)).toBe(true);
      expect(optimalWinner(solved)).toBe(0);
    });
  });

  describe('optimal winner (minimax)', () => {
    it('is a forced first-player win from the empty board', () => {
      expect(optimalWinner(generateStartBoard())).toBe(0);
    });

    it('every legal first move preserves the first player win', () => {
      const start = generateStartBoard();
      for (const move of legalMoves(start)) {
        expect(optimalWinner(applyMove(start, move))).toBe(0);
      }
    });

    it('declares the second player the winner whenever the game jams', () => {
      // two empty cells (5, 7) remain but neither accepts any digit: the game is
      // jammed, so the second player wins no matter whose turn it is. (A single
      // empty cell can always be filled, so jamming needs at least two gaps.)
      const board: Board = [1, 2, 3, 2, 1, 0, 3, 0, 1];
      expect(isFull(board)).toBe(false);
      expect(legalMoves(board)).toEqual([]);
      expect(optimalWinner(board)).toBe(1);
    });
  });

  describe('getSmartBotStep', () => {
    it('always returns a legal move', () => {
      const board: Board = [1, 0, 0, 0, 0, 0, 0, 0, 0];
      const { cell, digit } = getSmartBotStep(board);
      expect(isLegalPlacement(board, cell, digit)).toBe(true);
    });

    it('as first player, forces a win against any opponent', () => {
      // smart bot is player 0 (starts from empty), so it must win every game
      const alwaysFirstLegal = (b: Board): Move => legalMoves(b)[0];
      const randomOpponent = (b: Board): Move => getRandomBotStep(b);
      for (let i = 0; i < 40; i++) {
        expect(playGame(getSmartBotStep, alwaysFirstLegal)).toBe(0);
        expect(playGame(getSmartBotStep, randomOpponent)).toBe(0);
      }
    });

    it('realises the theoretical value from any reachable position (smart vs smart)', () => {
      // Collect reachable mid-game positions via random playouts, then play them
      // out smart-vs-smart. Two optimal players must always reach the outcome
      // predicted by the minimax value — for both winning and losing sides.
      const positions: Board[] = [];
      for (let i = 0; i < 60; i++) {
        let board = generateStartBoard();
        while (!isTerminal(board)) {
          positions.push([...board]);
          board = applyMove(board, getRandomBotStep(board));
        }
      }
      for (const position of positions) {
        expect(playGame(getSmartBotStep, getSmartBotStep, position)).toBe(optimalWinner(position));
      }
    });
  });

  describe('getRandomBotStep', () => {
    it('always returns a legal move', () => {
      const board: Board = [1, 2, 0, 0, 0, 0, 0, 0, 0];
      for (let i = 0; i < 20; i++) {
        const { cell, digit } = getRandomBotStep(board);
        expect(isLegalPlacement(board, cell, digit)).toBe(true);
      }
    });

    it('takes an immediate first-player win (filling the last cell) when available', () => {
      // one empty cell (8); player to move is player 0 (8 filled); digit 2 fits
      const board: Board = [1, 2, 3, 2, 3, 1, 3, 1, 0];
      expect(playerToMove(board)).toBe(0);
      const { cell, digit } = getRandomBotStep(board);
      expect(cell).toBe(8);
      expect(digit).toBe(2);
    });
  });
});

describe('isLegalPlacement argument checks', () => {
  it('refuses a digit outside 1..3', () => {
    const board = generateStartBoard();
    expect(isLegalPlacement(board, 0, 0)).toBe(false);
    expect(isLegalPlacement(board, 0, 4)).toBe(false);
    expect(isLegalPlacement(board, 0, 1.5)).toBe(false);
  });

  it('refuses a cell outside the 3x3 grid', () => {
    const board = generateStartBoard();
    expect(isLegalPlacement(board, -1, 1)).toBe(false);
    expect(isLegalPlacement(board, 9, 1)).toBe(false);
    expect(isLegalPlacement(board, 0.5, 1)).toBe(false);
  });

  it('accepts exactly the moves the generator lists', () => {
    const board = applyMove(applyMove(generateStartBoard(), { cell: 0, digit: 1 }), { cell: 4, digit: 2 });
    const listed = new Set(legalMoves(board).map(m => `${m.cell},${m.digit}`));
    for (let cell = 0; cell < 9; cell++) {
      for (const digit of [1, 2, 3]) {
        expect(isLegalPlacement(board, cell, digit)).toBe(listed.has(`${cell},${digit}`));
      }
    }
  });
});
