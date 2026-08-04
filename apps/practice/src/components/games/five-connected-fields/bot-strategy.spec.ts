import { isWinningForMover, getBotMove } from "./bot-strategy";
import { hasAnyMove, isNodePlayable, legalNodes, type Board } from "./gameplay";

const addCoin = (board: Board, node: number): Board => {
  const next = board.slice();
  next[node] += 1;
  return next;
};

describe("five connected fields strategy", () => {
  it("empty board is a win for the first player (player to move)", () => {
    expect(isWinningForMover([0, 0, 0, 0, 0])).toBe(true);
  });

  it("first coin must go on a degree-2 field (C, D or E) to win", () => {
    // Per the solution, opening on a hub (A or B) loses, so the bot opens on
    // one of the side-2 fields, indices 2, 3, 4.
    expect([2, 3, 4]).toContain(getBotMove([0, 0, 0, 0, 0]));
  });

  it("after a correct opening, the second player is in a losing position", () => {
    // First player placed a coin on C (index 2).
    expect(isWinningForMover([0, 0, 1, 0, 0])).toBe(false);
  });

  it("after C then A, the first player's unique winning move is a 2nd coin on A", () => {
    // Solution: from A=1, C=1 (first player to move) the only winning reply is
    // to play A again; then the second player is lost whatever they do.
    expect(getBotMove([1, 0, 1, 0, 0])).toBe(0);
    expect(isWinningForMover([2, 0, 1, 0, 0])).toBe(false);
  });

  it("detects a terminal position (no line has equal endpoints)", () => {
    // Hubs at 1, side-2 fields at 0: value sets {1} and {0} are disjoint.
    expect(hasAnyMove([1, 1, 0, 0, 0])).toBe(false);
  });

  it("a field is playable exactly when a neighbour holds the same count", () => {
    expect(isNodePlayable([0, 0, 0, 0, 0], 0)).toBe(true); // A equals C/D/E
    expect(isNodePlayable([1, 1, 0, 0, 0], 0)).toBe(false); // A(1) has no side-2 field at 1
  });

  it("bot always makes a legal move from the opening position", () => {
    const board: Board = [0, 0, 0, 0, 0];
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
    walk([0, 0, 0, 0, 0]);

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

  it("optimal first player wins against every possible second-player line", () => {
    // Exhaustive proof of optimality: player 0 plays getBotMove, player 1 tries
    // every legal reply. The first player must place the last coin on every line.
    let games = 0;
    let maxCoin = 0;
    const play = (board: Board, toMove: number, lastMover: number) => {
      maxCoin = Math.max(maxCoin, ...board);
      if (!hasAnyMove(board)) {
        games += 1;
        expect(lastMover).toBe(0);
        return;
      }
      if (toMove === 0) {
        play(addCoin(board, getBotMove(board)), 1, 0);
      } else {
        for (const node of legalNodes(board)) play(addCoin(board, node), 0, 1);
      }
    };
    play([0, 0, 0, 0, 0], 0, -1);
    expect(games).toBeGreaterThan(0);
    expect(maxCoin).toBeLessThanOrEqual(3); // state space stays tiny
  });
});
