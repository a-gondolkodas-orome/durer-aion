import { sortBy, sum } from 'lodash';
import { runMatch, type MatchResult } from '../../strategy-game-factory';
import { type Board, moves } from './gameplay';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';

// Take one match from a pile, or merge two piles; taking the last match wins.
// Piles are independent of nothing here — merging couples them — so there is no
// Grundy shortcut, and the bot searches. What the search has to be checked
// against is a reference built from the moves themselves.
type Bot = typeof smartBotStrategy

const play = (startBoard: Board, strategies: [Bot, Bot]): MatchResult<Board> =>
  runMatch({ gameplay: { moves }, strategies, startBoard });

const referenceMoverLoses = (() => {
  const memo = new Map<string, boolean>();
  const value = (board: Board): boolean => {
    const piles = sortBy(board);
    const key = piles.join(',');
    if (memo.has(key)) return memo.get(key)!;
    // An empty board means the previous player took the last match and won.
    if (piles.length === 0) { memo.set(key, true); return true; }
    memo.set(key, true); // guard against revisits while this board is in flight
    let canWin = false;
    for (let i = 0; i < piles.length && !canWin; i++) {
      const afterRemove = piles.filter((_, idx) => idx !== i);
      if (piles[i]! > 1) afterRemove.push(piles[i]! - 1);
      if (value(afterRemove)) canWin = true;
      for (let j = i + 1; j < piles.length && !canWin; j++) {
        const afterMerge = piles.filter((_, idx) => idx !== i && idx !== j);
        afterMerge.push(piles[i]! + piles[j]!);
        if (value(afterMerge)) canWin = true;
      }
    }
    memo.set(key, !canWin);
    return !canWin;
  };
  return value;
})();

// Every board of up to four piles of up to six matches — a superset of what
// the game's own start boards (two to four piles of two to five) can reach.
const everyBoard = (() => {
  const out: Board[] = [];
  const rec = (piles: number[], minSize: number) => {
    if (piles.length > 0) out.push([...piles]);
    if (piles.length === 4) return;
    for (let size = minSize; size <= 6; size++) rec([...piles, size], size);
  };
  rec([], 1);
  return out;
})();

const WON_FOR_MOVER = everyBoard.filter(b => !referenceMoverLoses(b));
const LOST_FOR_MOVER = everyBoard.filter(b => referenceMoverLoses(b));

describe('smartBotStrategy', () => {
  // The strongest thing available here, and cheap: from every winnable board,
  // the move it names has to leave the opponent a lost one.
  it('names a winning move from every board that has one', () => {
    for (const board of WON_FOR_MOVER) {
      const after = play(board, [smartBotStrategy, randomBotStrategy]).history[0]!.board;
      expect({ board, after, lost: referenceMoverLoses(after) })
        .toEqual({ board, after, lost: true });
    }
  });

  // The regression this spec was written for. An earlier version picked its
  // move by the parity of sum + pileCount, which is a decent rule of thumb but
  // not a theorem: from [1,1,1,x] with x odd it merged two singles and handed
  // the game away. [2,2,2,2] reduces to [1,1,1,1] in four moves, so these are
  // ordinary positions, not curiosities.
  it.each([[[1, 1, 1, 1]], [[1, 1, 1, 3]], [[1, 1, 1, 5]], [[1, 2]], [[1, 1, 2]]])(
    'wins from %j, where the parity rule of thumb disagrees with the search',
    (board: Board) => {
      expect(referenceMoverLoses(board)).toBe(false);
      for (let trial = 0; trial < 10; trial++) {
        expect(play(board, [smartBotStrategy, randomBotStrategy]).winnerIndex).toBe(0);
      }
    }
  );

  it('wins as the mover from winnable boards, against a random opponent', () => {
    for (const board of WON_FOR_MOVER.slice(0, 40)) {
      expect(play(board, [smartBotStrategy, randomBotStrategy]).winnerIndex).toBe(0);
    }
  });

  it('wins as the replier from boards lost for the mover', () => {
    for (const board of LOST_FOR_MOVER.slice(0, 40)) {
      expect(play(board, [randomBotStrategy, smartBotStrategy]).winnerIndex).toBe(1);
    }
  });

  it('holds a won board against optimal play', () => {
    for (const board of WON_FOR_MOVER.slice(0, 20)) {
      expect(play(board, [smartBotStrategy, smartBotStrategy]).winnerIndex).toBe(0);
    }
  });
});

describe('the parity rule of thumb', () => {
  // Kept as a fact about the game rather than a rule anything depends on: it is
  // right most of the time, which is what made it convincing, and wrong often
  // enough to lose games.
  it('disagrees with the search on a real share of boards', () => {
    const wrong = everyBoard.filter(
      b => referenceMoverLoses(b) !== ((sum(b) + b.length) % 2 === 1)
    );
    expect(wrong.length).toBeGreaterThan(0);
    expect(wrong).toContainEqual([1, 2]);
    expect(wrong).toContainEqual([1, 1, 1]);
  });
});

describe('randomBotStrategy', () => {
  it('takes the last match when one pile of one is left', () => {
    const { winnerIndex, history } = play([1], [randomBotStrategy, randomBotStrategy]);
    expect(history).toHaveLength(1);
    expect(winnerIndex).toBe(0);
  });
});
