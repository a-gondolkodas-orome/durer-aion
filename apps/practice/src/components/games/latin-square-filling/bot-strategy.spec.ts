import {
  getRandomBotStep,
  getSmartBotStep,
  optimalWinner
} from './bot-strategy';
import {
  applyMove,
  generateStartBoard,
  isFull,
  isTerminal,
  legalMoves,
  moves,
  playerToMove,
  type Board,
  type Move
} from './gameplay';
import { moveValidator } from 'test-utils';

const isLegalPlacement = moveValidator(moves.placeDigit);

describe('latin-square-filling bot', () => {
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

  describe('optimal winner (minimax)', () => {
    it('is a forced first-player win from the empty board', () => {
      expect(optimalWinner(generateStartBoard())).toBe(0);
    });

    it('credits a completed Latin square to the first player', () => {
      expect(optimalWinner([1, 2, 3, 2, 3, 1, 3, 1, 2])).toBe(0);
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
