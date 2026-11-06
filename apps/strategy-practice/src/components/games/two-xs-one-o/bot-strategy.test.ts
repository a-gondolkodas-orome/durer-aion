// The boards drawn as rows of X, O and . are not words.
// cspell:ignoreRegExp /[XO.\/]{5,}/g
import { range } from 'lodash';
import { runMatch, type BotStrategy } from 'strategy-game-factory';
import { botNextMove, forcedWinnerIndex, makeCtx } from 'test-utils';
import { oWinsAfter, randomBotStrategy, smartBotStrategy } from './bot-strategy';
import {
  lines, markOf, moves, playerOf, startBoardOFirst, startBoardXFirst, winningLine,
  type Board, type Mark, type TurnState
} from './gameplay';

const gameplay = { moves };
const key = (cells: Board['cells']) => cells.map(c => c ?? '.').join('');
const emptyIds = (cells: Board['cells']) => range(cells.length).filter(id => cells[id] === null);

// A board drawn as five rows of `X`, `O` and `.`, e.g. 'XX.../...../...'.
const drawn = (rows: string, firstMark: Mark): Board => ({
  cells: rows.replace(/\//g, '').split('').map(c => c === '.' ? null : c as Mark),
  firstMark
});

// Plays the turn a strategy names through the game's own move, threading the
// turn state the way the engine does. Returns the board, and the winner if the
// turn ended the game.
const playTurn = (strategy: typeof smartBotStrategy, board: Board, currentPlayer: number) => {
  let turnState: TurnState | null = null;
  let current = board;
  for (const { args } of [strategy({ board, ctx: makeCtx({ currentPlayer }) })].flat()) {
    const outcome = moves.placeMark.apply(current, { ctx: makeCtx<TurnState>({ currentPlayer, turnState }) }, args![0]);
    current = outcome.nextBoard;
    if (outcome.gameEnd) return { board: current, winner: outcome.gameEnd.winnerIndex };
    if (outcome.isTurnEnd) break;
    turnState = outcome.nextTurnState ?? null;
  }
  return { board: current, winner: undefined };
};

// Whether O wins with `toMove` to play, by plain minimax over the cells — no
// abstraction, so it is a check on the solver's. Only for late positions.
const oWinsByBruteForce = (cells: Board['cells'], toMove: Mark, memo = new Map<string, boolean>()): boolean => {
  const k = toMove + key(cells);
  const saved = memo.get(k);
  if (saved !== undefined) return saved;
  const with_ = (cs: Board['cells'], id: number, mark: Mark) => cs.map((c, i) => i === id ? mark : c);
  const full = (cs: Board['cells']) => cs.every(c => c !== null);
  let wins: boolean;
  if (toMove === 'O') {
    wins = emptyIds(cells).some(id => {
      const after = with_(cells, id, 'O');
      return full(after) || oWinsByBruteForce(after, 'X', memo);
    });
  } else {
    wins = emptyIds(cells).every(first => {
      const afterFirst = with_(cells, first, 'X');
      if (winningLine(afterFirst)) return false;
      if (full(afterFirst)) return true;
      return emptyIds(afterFirst).every(second => {
        const after = with_(afterFirst, second, 'X');
        if (winningLine(after)) return false;
        return full(after) || oWinsByBruteForce(after, 'O', memo);
      });
    });
  }
  memo.set(k, wins);
  return wins;
};

// Random positions with X to move: random play, stopped after O's move once at
// most `maxEmpty` cells are left.
const randomPositionsXToMove = (count: number, maxEmpty: number): Board['cells'][] => {
  const positions: Board['cells'][] = [];
  while (positions.length < count) {
    let board = startBoardOFirst;
    let player = 0;
    for (;;) {
      const { board: next, winner } = playTurn(randomBotStrategy, board, player);
      if (winner !== undefined) break;
      board = next;
      player = 1 - player;
      if (markOf(board, player) === 'X' && emptyIds(board.cells).length <= maxEmpty) {
        positions.push(board.cells);
        break;
      }
    }
  }
  return positions;
};

describe('smartBotStrategy as X', () => {
  // The opening is drawn at random, but every opening it draws is the same up to
  // permuting rows and columns, which the rules cannot tell apart.
  it.each([
    ['C', startBoardXFirst],
    ['D and E', startBoardOFirst]
  ])('in %s, wins against every line O can play', (_, start) => {
    const xPlayer = playerOf(start, 'X');
    const losses: string[] = [];
    const seen = new Set<string>();
    const oToMove = (board: Board) => {
      if (seen.has(key(board.cells))) return;
      seen.add(key(board.cells));
      for (const id of emptyIds(board.cells)) {
        const outcome = moves.placeMark.apply(board, { ctx: makeCtx({ currentPlayer: 1 - xPlayer }) }, id);
        if (outcome.gameEnd) {
          losses.push(key(outcome.nextBoard.cells));
          continue;
        }
        const { board: after, winner } = playTurn(smartBotStrategy, outcome.nextBoard, xPlayer);
        if (winner === undefined) oToMove(after);
        else if (winner !== xPlayer) losses.push(key(after.cells));
      }
    };
    if (xPlayer === 0) oToMove(playTurn(smartBotStrategy, start, 0).board);
    else oToMove(start);

    expect(losses).toEqual([]);
    expect(seen.size).toBeGreaterThan(100);
  });

  it.each([
    ['C', startBoardXFirst],
    ['D and E', startBoardOFirst]
  ])('in %s, beats its own O bot from the start board', (_, start) => {
    expect(forcedWinnerIndex({ gameplay, botStrategy: smartBotStrategy, startBoard: start }))
      .toBe(playerOf(start, 'X'));
  });
});

describe('the O solver', () => {
  it('agrees with brute force on late positions', () => {
    const disagreements = randomPositionsXToMove(60, 9)
      .filter(cells => oWinsAfter(cells) !== oWinsByBruteForce(cells, 'X'))
      .map(key);
    expect(disagreements).toEqual([]);
  });

  it('finds positions either side wins, so the comparison above means something', () => {
    const outcomes = new Set(randomPositionsXToMove(60, 9).map(oWinsAfter));
    expect(outcomes).toEqual(new Set([true, false]));
  });
});

describe('smartBotStrategy as O', () => {
  // In each, exactly one O wins, and blocking the most Xs alone would play
  // another: random playouts turned these up.
  it.each([
    ['XXO../O.X../O.X../.X.X./.....', 21],
    ['XX.../.XX../.X.OX/.O.X./O..OX', 4]
  ])('finds the only winning O in %s', (rows, winningId) => {
    const board = drawn(rows, 'O');
    const named = range(10)
      .map(() => botNextMove(smartBotStrategy({ board, ctx: makeCtx({ currentPlayer: 0 }) })).args![0]);
    expect(new Set(named)).toEqual(new Set([winningId]));
  });

  it('plays a winning O whenever X has left one', () => {
    const missed: string[] = [];
    let winnable = 0;
    for (const cells of randomPositionsXToMove(200, 20)) {
      // Let X slip once more at random, so that O is to move.
      const board: Board = { cells, firstMark: 'O' };
      const { board: afterX, winner } = playTurn(randomBotStrategy, board, 1);
      if (winner !== undefined) continue;
      const canWin = emptyIds(afterX.cells).some(id => oWinsAfter(afterX.cells.map((c, i) => i === id ? 'O' : c)));
      if (!canWin) continue;
      winnable++;
      const [id] = botNextMove(smartBotStrategy({ board: afterX, ctx: makeCtx({ currentPlayer: 0 }) })).args!;
      const after = afterX.cells.map((c, i) => i === id ? 'O' : c);
      if (!after.every(c => c !== null) && !oWinsAfter(after)) missed.push(key(afterX.cells));
    }
    expect(missed).toEqual([]);
    expect(winnable).toBeGreaterThan(0);
  });
});

describe('matches against the random bot', () => {
  // runMatch throws on any move the game's own validate rejects, so these also
  // pin that both bots only ever name legal moves.
  it.each([
    ['C', startBoardXFirst],
    ['D and E', startBoardOFirst]
  ])('in %s, the smart bot wins as X from either seat', (_, start) => {
    const xPlayer = playerOf(start, 'X');
    const strategies: [BotStrategy<Board>, BotStrategy<Board>] = xPlayer === 0
      ? [smartBotStrategy, randomBotStrategy]
      : [randomBotStrategy, smartBotStrategy];
    const winners = range(30).map(() => runMatch({ gameplay, strategies, startBoard: start }).winnerIndex);
    expect(new Set(winners)).toEqual(new Set([xPlayer]));
  });

  it('plays the smart O and the random X to an end', () => {
    range(30).forEach(() => {
      expect(() => runMatch({
        gameplay,
        strategies: [smartBotStrategy, randomBotStrategy],
        startBoard: startBoardOFirst
      })).not.toThrow();
    });
  });
});

describe('randomBotStrategy', () => {
  it('completes a line of Xs whenever it can', () => {
    const board = drawn('XXX../...../...../...../.....', 'X');
    const named = [randomBotStrategy({ board, ctx: makeCtx({ currentPlayer: 0 }) })].flat()
      .map(({ args }) => args![0]);
    const completed = lines.find(line => line.every(id => board.cells[id] === 'X' || named.includes(id)));
    expect(completed).toBeDefined();
  });

});
