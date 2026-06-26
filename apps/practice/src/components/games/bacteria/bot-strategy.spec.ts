import { smartBotDefense, smartBotAttack } from "./bot-strategy";
import { reverse } from "lodash";

describe('test ai strategy', () => {
  describe('defense', () => {
    it('removes a bacteria if it could reach goals', () => {
      const bacteria = reverse([
        [1, 0, 0],
          [0, 0],
        [0, 0, 1]
      ]);
      const board = { bacteria, goals: [1] };
      expect(smartBotDefense(board)).toEqual({ defenseRow: 2, defenseCol: 0 })
    });

    it('removes a bacteria if it could reach goals with a jump', () => {
      const bacteria = reverse([
        [0, 0, 0],
          [1, 0],
        [0, 0, 1]
      ]);
      const board = { bacteria, goals: [2] };
      expect(smartBotDefense(board)).toEqual({ defenseRow: 0, defenseCol: 2 })
    });

    it('removes a closer dangerous bacteria', () => {
      const bacteria = reverse([
        [0, 0, 0, 0, 0],
         [0, 0, 0, 0],
        [0, 0, 0, 0, 1],
         [0, 0, 1, 0],
        [0, 0, 0, 0]
      ]);
      const board = { bacteria, goals: [2, 3, 4] };
      expect(smartBotDefense(board)).toEqual({ defenseRow: 2, defenseCol: 4 })
    });

    it('removes a more dangerous bacteria even if no immediate threat', () => {
      const bacteria = reverse([
        [0, 0, 0, 0, 0],
          [0, 0, 0, 0],
        [1, 0, 0, 1, 0]
      ]);
      const board = { bacteria, goals: [2] };
      expect(smartBotDefense(board)).toEqual({ defenseRow: 0, defenseCol: 3 })
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
      expect(smartBotDefense(board)).toEqual({ defenseRow: 0, defenseCol: 3 })
    });

    it('removes a bacteria if multiple in a cell', () => {
      const bacteria = reverse([
        [0, 0, 0, 0, 0],
          [0, 0, 0, 0],
        [0, 2, 1, 0, 0]
      ]);
      // (0,1) holds two bacteria (a "multiple" path); (0,2) sits in the
      // dangerous zone. The multiple-cell path must win, so a regression that
      // counts cells instead of bacteria (treating the 2 as a single bacterium)
      // would fall back to the dangerous (0,2) and fail.
      const board = { bacteria, goals: [2] };
      expect(smartBotDefense(board)).toEqual({ defenseRow: 0, defenseCol: 1 })
    });

    it('removes a bacteria from a path with multiple bacteria', () => {
      const bacteria = reverse([
        [0, 0, 1, 0, 0],
          [1, 1, 0, 0],
        [0, 0, 1, 0, 0]
      ]);
      const board = { bacteria, goals: [4] };
      const d = smartBotDefense(board);
      expect([{ defenseRow: 1, defenseCol: 1 }, { defenseRow: 0, defenseCol: 2 }]).toContainEqual(d);
    });

    it('removes a bacteria from a path with multiple bacteria: right side', () => {
      const bacteria = reverse([
        [0, 0, 1, 0, 0],
          [0, 0, 1, 1],
        [0, 0, 1, 0, 0]
      ]);
      const board = { bacteria, goals: [0] };
      const d = smartBotDefense(board);
      expect([{ defenseRow: 1, defenseCol: 2 }, { defenseRow: 0, defenseCol: 2 }]).toContainEqual(d);
    });

    it('removes a dangerous bacteria if no multiple', () => {
      const bacteria = reverse([
        [0, 0, 0, 0, 0],
          [1, 0, 0, 1],
        [0, 0, 1, 0, 0]
      ]);
      const board = { bacteria, goals: [2] };
      expect(smartBotDefense(board)).toEqual({ defenseRow: 0, defenseCol: 2 })
    });

    it('removes dangerous bacteria if multiples cannot spread', () => {
      const bacteria = reverse([
        [0, 0, 0, 0, 0],
          [0, 0, 0, 0],
        [2, 0, 1, 0, 0]
      ]);
      const board = { bacteria, goals: [2] };
      expect(smartBotDefense(board)).toEqual({ defenseRow: 0, defenseCol: 2 })
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
      expect(smartBotAttack(board)).toEqual({ attackChoice: "shiftRight", attackRow: 2, attackCol: 0 })
    });

    it('reaches goal with shiftLeft if it can', () => {
      const bacteria = reverse([
        [0, 0, 1],
          [0, 0],
        [0, 0, 1]
      ]);
      const board = { bacteria, goals: [1] };
      expect(smartBotAttack(board)).toEqual({ attackChoice: "shiftLeft", attackRow: 2, attackCol: 2 })
    });

    it('reaches goal with spread if it can', () => {
      const bacteria = reverse([
        [0, 0, 0],
          [1, 0],
        [0, 0, 1]
      ]);
      const board = { bacteria, goals: [1] };
      expect(smartBotAttack(board)).toEqual({ attackChoice: "spread", attackRow: 1, attackCol: 0 })
    });

    it('reaches goal with jump if it can', () => {
      const bacteria = reverse([
        [0, 0, 0],
          [1, 0],
        [0, 0, 1]
      ]);
      const board = { bacteria, goals: [2] };
      expect(smartBotAttack(board)).toEqual({ attackChoice: "jump", attackRow: 0, attackCol: 2 })
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

      expect(smartBotAttack(board)).toEqual({ attackChoice: "spread", attackRow: 0, attackCol: 3 })
    });

    it('makes a valid move from a losing position', () => {
      const bacteria = reverse([
        [0, 0, 0],
          [0, 0],
        [0, 0, 1]
      ]);
      const board = { bacteria, goals: [1] }
      const attack = smartBotAttack(board);

      const variantA = {
        attackChoice: "jump",
        attackRow: 0,
        attackCol: 2
      }
      const variantB = {
        attackChoice: "spread",
        attackRow: 0,
        attackCol: 2
      };
      const variantC = {
        attackChoice: "shiftLeft",
        attackRow: 0,
        attackCol: 2
      };
      expect([variantA, variantB, variantC]).toContainEqual(attack);
    });

    it('attack with multiple bacteria if no dangerous one', () => {
      const bacteria = reverse([
        [0, 0, 0, 0, 0],
          [2, 0, 0, 0],
        [0, 0, 0, 0, 1]
      ]);
      const board = { bacteria, goals: [3] };
      const attack = smartBotAttack(board);
      expect(attack).toEqual({
        attackChoice: "spread",
        attackRow: 1,
        attackCol: 0
      })
    });

    it('should attack with closest dangerous bacteria', () => {
      const bacteria = reverse([
        [0, 0, 0, 0, 0],
          [0, 1, 0, 0],
        [0, 1, 0, 1, 0],
          [0, 1, 1, 0],
        [0, 0, 1, 0, 0]
      ]);
      const board = { bacteria, goals: [1, 2, 3] };
      const { attackRow, attackCol } = smartBotAttack(board);
      expect([attackRow, attackCol]).toEqual([3, 1])
    });
  });
});
