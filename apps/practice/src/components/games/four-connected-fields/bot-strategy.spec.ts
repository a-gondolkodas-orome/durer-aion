import { isWinningForMover, getBotMove } from "./bot-strategy";
import { hasAnyMove, isNodePlayable, legalNodes, type Board } from "./gameplay";

const addCoin = (board: Board, node: number): Board => {
  const next = board.slice();
  next[node] += 1;
  return next;
};

describe("four connected fields strategy", () => {
  it("empty board is a loss for the first player (second player wins)", () => {
    // Per the official solution, the second player has the winning strategy.
    expect(isWinningForMover([0, 0, 0, 0])).toBe(false);
  });

  it("after any opening, the second player (to move) is in a winning position", () => {
    // Every child of the empty board must be winning for the mover, since the
    // empty board is losing for the mover.
    expect(isWinningForMover([1, 0, 0, 0])).toBe(true); // opening on a hub (A)
    expect(isWinningForMover([0, 0, 1, 0])).toBe(true); // opening on a degree-2 field (C)
  });

  it("an empty field is always playable, even with no equal-count neighbour", () => {
    // This is the extra rule vs. five connected fields: placing on any empty field.
    // C (index 2) is empty; its neighbours A=1, B=2 are non-zero and unequal to 0.
    expect(isNodePlayable([1, 2, 0, 3], 2)).toBe(true);
  });

  it("a non-empty field is playable exactly when a neighbour holds the same count", () => {
    expect(isNodePlayable([1, 2, 1, 3], 2)).toBe(true); // C(1) equals A(1)
    expect(isNodePlayable([2, 3, 1, 4], 2)).toBe(false); // C(1) has no equal neighbour
  });

  it("detects a terminal position (no empty field, no line with equal endpoints)", () => {
    // Case 3 from the solution: A=2, B=3, C=1, D=1. No field empty; no edge equal.
    expect(hasAnyMove([2, 3, 1, 1])).toBe(false);
  });

  it("bot always makes a legal move from the opening position", () => {
    const board: Board = [0, 0, 0, 0];
    const move = getBotMove(board);
    expect(isNodePlayable(board, move)).toBe(true);
  });

  it("from a losing position, the bot minimises the opponent's winning replies", () => {
    // The bot cannot win here, so it plays the move that leaves the opponent the
    // fewest winning replies (hardest to answer). Checked over every reachable
    // losing position.
    const opponentWinningReplies = (board: Board, node: number) => {
      const next = addCoin(board, node);
      return legalNodes(next).filter((n) => !isWinningForMover(addCoin(next, n))).length;
    };

    const seen = new Set<string>();
    const losing: Board[] = [];
    const walk = (board: Board) => {
      const key = board.join(",");
      if (seen.has(key)) return;
      seen.add(key);
      if (!hasAnyMove(board)) return;
      if (!isWinningForMover(board)) losing.push(board);
      for (const n of legalNodes(board)) walk(addCoin(board, n));
    };
    walk([0, 0, 0, 0]);

    let sawRealChoice = false; // a position where min != max, so min vs max matters
    for (const board of losing) {
      const counts = legalNodes(board).map((n) => opponentWinningReplies(board, n));
      const min = Math.min(...counts);
      if (min !== Math.max(...counts)) sawRealChoice = true;
      // sample a few times since ties are broken randomly
      for (let i = 0; i < 8; i++) {
        expect(opponentWinningReplies(board, getBotMove(board))).toBe(min);
      }
    }
    expect(losing.length).toBeGreaterThan(0);
    expect(sawRealChoice).toBe(true);
  });

  it("optimal second player wins against every possible first-player line", () => {
    // Exhaustive proof of optimality: player 1 (the bot, second to move) plays
    // getBotMove, player 0 tries every legal reply. The second player must place
    // the last coin on every line.
    let games = 0;
    let maxCoin = 0;
    const play = (board: Board, toMove: number, lastMover: number) => {
      maxCoin = Math.max(maxCoin, ...board);
      if (!hasAnyMove(board)) {
        games += 1;
        expect(lastMover).toBe(1);
        return;
      }
      if (toMove === 1) {
        play(addCoin(board, getBotMove(board)), 0, 1);
      } else {
        for (const node of legalNodes(board)) play(addCoin(board, node), 1, 0);
      }
    };
    play([0, 0, 0, 0], 0, -1);
    expect(games).toBeGreaterThan(0);
    expect(maxCoin).toBeLessThanOrEqual(4); // state space stays tiny
  });
});
