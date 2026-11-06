import { smartBotStrategy } from './bot-strategy';
import { generateEmptyBoard, isGameEnd, placeStone, type Board } from './gameplay';
import { botNextMoveArgs, makeCtx } from 'test-utils';

const smartBotPlacement = (board: Board, chosenRoleIndex: number): number =>
  botNextMoveArgs(smartBotStrategy({ board, ctx: makeCtx({ chosenRoleIndex }) }))[0];

describe('smartBotStrategy', () => {
  it('should not place a stone that immediately completes a line if a safe move exists', () => {
    const board = [
      true, true, false,
      false, false, false,
      false, false, false
    ];
    expect(smartBotPlacement(board, 0)).not.toBe(2);
  });

  it('should pick the only remaining move that does not complete a line, regardless of role', () => {
    const board = [
      true, true, false,
      false, true, true,
      true, false, false
    ];
    // empty cells are 2, 3, 7, 8; placing at 2, 3 or 7 each completes a line, only 8 is safe
    expect(smartBotPlacement(board, 0)).toBe(8);
    expect(smartBotPlacement(board, 1)).toBe(8);
  });

  it('should fall back to one of the remaining cells when every move completes a line', () => {
    const board = [
      false, true, true,
      true, false, true,
      true, true, false
    ];
    expect([0, 4, 8]).toContain(smartBotPlacement(board, 0));
  });

  // The search memoises by position, and the same position is asked about for
  // both roles — vitest runs with `isolate: false`, so another spec that played
  // this game has already filled that cache by the time this file runs. If whose
  // turn it is is left out of the memo key, the answers below come back for the
  // wrong player.
  it('should force the same win after the cache has been filled for the other role', () => {
    for (let firstMove = 0; firstMove < 9; firstMove++) {
      let board = placeStone(generateEmptyBoard(), firstMove);
      let mover = 0;
      while (!isGameEnd(board)) {
        board = placeStone(board, smartBotPlacement(board, mover));
        mover = 1 - mover;
      }
    }

    for (let firstMove = 0; firstMove < 9; firstMove++) {
      let board = placeStone(generateEmptyBoard(), firstMove);
      let mover = 1;
      while (!isGameEnd(board)) {
        board = placeStone(board, smartBotPlacement(board, mover));
        mover = 1 - mover;
      }
      expect(mover).toBe(1);
    }
  });

  it('should let the second player always force a win with optimal play from an empty board', () => {
    for (let firstMove = 0; firstMove < 9; firstMove++) {
      let board = placeStone(generateEmptyBoard(), firstMove);
      let mover = 1;
      while (!isGameEnd(board)) {
        const id = smartBotPlacement(board, mover);
        board = placeStone(board, id);
        mover = 1 - mover;
      }
      // the player who just moved lost, so the winner is the current `mover`
      expect(mover).toBe(1);
    }
  });
});
