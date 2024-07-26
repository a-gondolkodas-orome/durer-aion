import { getGameStateAfterAiTurn } from "./strategy";
import { reverse, isEqual } from "lodash";

describe('test ai strategy', () => {
  describe('defense', () => {
    it('removes a bacteria if it could reach goals', () => {
      const bacteria = reverse([
        [1, 0, 0],
          [0, 0],
        [0, 0, 1]
      ]);
      const board = { bacteria, goals: [1] };
      const { newBoard, isGameEnd } = getGameStateAfterAiTurn({ board, playerIndex: 0 });
      expect(newBoard.bacteria[2][0]).toEqual(0);
      expect(isGameEnd).toBe(false);
    });

    it('removes a bacteria if it could reach goals with a jump', () => {
      const bacteria = reverse([
        [0, 0, 0],
          [1, 0],
        [0, 0, 1]
      ]);
      const board = { bacteria, goals: [2] };
      const { newBoard } = getGameStateAfterAiTurn({ board, playerIndex: 0 });
      expect(newBoard.bacteria[0][2]).toEqual(0);
    });

    it('only removes one bacteria', () => {
      const bacteria = reverse([
        [2, 0, 0],
          [0, 0],
        [0, 0, 0]
      ]);
      const board = { bacteria, goals: [1] };
      const { newBoard, isGameEnd } = getGameStateAfterAiTurn({ board, playerIndex: 0 });
      expect(newBoard.bacteria[2][0]).toEqual(1);
      expect(isGameEnd).toBe(false);
    });

    it('ends game if no more bacteria', () => {
      const bacteria = reverse([
        [1, 0, 0],
          [0, 0],
        [0, 0, 0]
      ]);
      const board = { bacteria, goals: [1] };
      const { isGameEnd } = getGameStateAfterAiTurn({ board, playerIndex: 0 });
      expect(isGameEnd).toBe(true);
    });

    it('removes a more dangerous bacteria even if no immediate threat', () => {
      const bacteria = reverse([
        [0, 0, 0, 0, 0],
          [0, 0, 0, 0],
        [1, 0, 0, 1, 0]
      ]);
      const board = { bacteria, goals: [2] };
      const { newBoard } = getGameStateAfterAiTurn({ board, playerIndex: 0 });
      expect(newBoard.bacteria[0][3]).toEqual(0);
    });

    it('removes a bacteria if it could reach goals in several steps', () => {
      const bacteria = reverse([
        [1, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 0, 0, 0]
      ]);
      const board = { bacteria, goals: [2, 3, 4] };
      const { newBoard } = getGameStateAfterAiTurn({ board, playerIndex: 0 });
      expect(newBoard.bacteria[0][3]).toEqual(0);
    });

    it('removes a bacteria if multiple in a cell', () => {
      const bacteria = reverse([
        [0, 0, 0, 0, 0],
          [0, 0, 0, 0],
        [2, 0, 0, 1, 0]
      ]);
      const board = { bacteria, goals: [2] };
      const { newBoard } = getGameStateAfterAiTurn({ board, playerIndex: 0 });
      expect(newBoard.bacteria[0][0]).toEqual(1);
    });

    it('removes a bacteria from a path with multiple bacteria', () => {
      const bacteria = reverse([
        [0, 0, 1, 0, 0],
          [1, 1, 0, 0],
        [0, 0, 1, 0, 0]
      ]);
      const board = { bacteria, goals: [4] };
      const { newBoard } = getGameStateAfterAiTurn({ board, playerIndex: 0 });
      expect(newBoard.bacteria[1][1] === 0 || newBoard.bacteria[0][2] === 0).toBe(true);
    });

    it('removes a bacteria from a path with multiple bacteria: right side', () => {
      const bacteria = reverse([
        [0, 0, 1, 0, 0],
          [0, 0, 1, 1],
        [0, 0, 1, 0, 0]
      ]);
      const board = { bacteria, goals: [0] };
      const { newBoard } = getGameStateAfterAiTurn({ board, playerIndex: 0 });
      expect(newBoard.bacteria[1][2] === 0 || newBoard.bacteria[0][2] === 0).toBe(true);
    });

    it('removes a dangerous bacteria if no multiple', () => {
      const bacteria = reverse([
        [0, 0, 0, 0, 0],
          [1, 0, 0, 1],
        [0, 0, 1, 0, 0]
      ]);
      const board = { bacteria, goals: [2] };
      const { newBoard } = getGameStateAfterAiTurn({ board, playerIndex: 0 });
      expect(newBoard.bacteria[0][2]).toEqual(0);
    });
  });

  describe('attack', () => {
    it('reaches goal with shiftRight if it can', () => {
      const bacteria = reverse([
        [1, 0, 0],
          [0, 0],
        [0, 0, 1]
      ]);
      const board = { bacteria, goals: [1] };
      const { newBoard, isGameEnd } = getGameStateAfterAiTurn({ board, playerIndex: 1 });
      expect(newBoard.bacteria[2][1]).toEqual(1);
      expect(isGameEnd).toBe(true);
    });

    it('reaches goal with shiftLeft if it can', () => {
      const bacteria = reverse([
        [0, 0, 1],
          [0, 0],
        [0, 0, 1]
      ]);
      const board = { bacteria, goals: [1] };
      const { newBoard, isGameEnd } = getGameStateAfterAiTurn({ board, playerIndex: 1 });
      expect(newBoard.bacteria[2][1]).toEqual(1);
      expect(isGameEnd).toBe(true);
    });

    it('reaches goal with spread if it can', () => {
      const bacteria = reverse([
        [0, 0, 0],
          [1, 0],
        [0, 0, 1]
      ]);
      const board = { bacteria, goals: [1] };
      const { newBoard, isGameEnd } = getGameStateAfterAiTurn({ board, playerIndex: 1 });
      expect(newBoard.bacteria[2][1]).toEqual(1);
      expect(isGameEnd).toBe(true);
    });

    it('reaches goal with jump if it can', () => {
      const bacteria = reverse([
        [0, 0, 0],
          [1, 0],
        [0, 0, 1]
      ]);
      const board = { bacteria, goals: [2] };
      const { newBoard } = getGameStateAfterAiTurn({ board, playerIndex: 1 });
      expect(newBoard.bacteria[2][2]).toEqual(1);
    });

    it('spreads a dangerous bacteria if it can', () => {
      const bacteria = reverse([
        [1, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 1, 0],
          [0, 0, 0, 0, 1, 0],
        [0, 0, 0, 1, 0, 0, 0]
      ]);
      const board = { bacteria, goals: [2, 3, 4] };

      const { newBoard, isGameEnd } = getGameStateAfterAiTurn({ board, playerIndex: 1 });

      const expectedBacteria = reverse([
        [1, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 1, 0],
          [0, 0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 0]
      ]);
      expect(newBoard.bacteria).toEqual(expectedBacteria);
      expect(isGameEnd).toBe(false);
    });

    it('makes a valid move from a losing position', () => {
      const bacteria = reverse([
        [0, 0, 0],
          [0, 0],
        [0, 0, 1]
      ]);
      const board = { bacteria, goals: [1] }

      const { newBoard, isGameEnd } = getGameStateAfterAiTurn({ board, playerIndex: 1 });

      const variantA = reverse([
        [0, 0, 0],
          [0, 0],
        [0, 1, 0]
      ]);
      const variantB = reverse([
        [0, 0, 0],
          [0, 1],
        [0, 0, 0]
      ]);
      const variantC = reverse([
        [0, 0, 1],
          [0, 0],
        [0, 0, 0]
      ]);
      expect(
        isEqual(newBoard.bacteria, variantA) ||
        isEqual(newBoard.bacteria, variantB) ||
        isEqual(newBoard.bacteria, variantC)
      ).toBe(true);
      expect(isGameEnd).toBe(false);
    });
  });
});
