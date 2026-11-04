import { range, sample } from 'lodash';
import type { BotMove, BotStrategy } from 'strategy-game-factory';
import { BOARD_SIZE, lines, markOf, type Board, type Moves } from './gameplay';

type Bot = BotStrategy<Board, Moves>;

// The X player wins in both orders, by the opening sequence in `smartXTurn`;
// bot-strategy.test.ts checks it against every line O can play. The O bot
// cannot win against it, so it plays the exact solver below, which takes any
// win a mistake by X hands it.

const place = (ids: number[]): BotMove<Moves>[] => ids.map(id => ({ move: 'placeMark', args: [id] }));

const emptyIds = (cells: Board['cells'], ids: number[] = range(cells.length)) =>
  ids.filter(id => cells[id] === null);

const linesWithoutO = (cells: Board['cells']) => lines.filter(line => line.every(id => cells[id] !== 'O'));

// Up to two empty cells that complete a line of Xs, if there are any.
const completingXs = (cells: Board['cells']): number[] | undefined =>
  linesWithoutO(cells).map(line => emptyIds(cells, line)).find(empty => empty.length <= 2);

const randomXTurn = (cells: Board['cells']): number[] => {
  const first = sample(emptyIds(cells))!;
  const rest = emptyIds(cells).filter(id => id !== first);
  return rest.length === 0 ? [first] : [first, sample(rest)!];
};

const smartXTurn = (cells: Board['cells']): number[] => {
  const countX = (ids: number[]) => ids.filter(id => cells[id] === 'X').length;
  const clearLines = linesWithoutO(cells);
  const numberOfX = countX(range(cells.length));

  const win = completingXs(cells);
  if (win) return win;

  if (numberOfX === 0) {
    // Both Xs, and the opening O when there is one, in distinct rows and columns.
    const os = range(cells.length).filter(id => cells[id] === 'O');
    const free = (id: number, taken: number[]) => cells[id] === null
      && taken.every(t => Math.floor(t / BOARD_SIZE) !== Math.floor(id / BOARD_SIZE)
        && t % BOARD_SIZE !== id % BOARD_SIZE);
    const first = sample(range(cells.length).filter(id => free(id, os)))!;
    const second = sample(range(cells.length).filter(id => free(id, [...os, first])))!;
    return [first, second];
  }

  if (numberOfX === 2) {
    // Complete the L, then extend its main line to three Xs to form a T. Keep
    // the stem and the perpendicular line through the new tip free of Os.
    const singleLines = clearLines.filter(line => countX(line) === 1);
    for (const main of singleLines) {
      for (const stem of singleLines) {
        if (main === stem) continue;
        const corner = main.find(id => stem.includes(id));
        if (corner === undefined || cells[corner] !== null) continue;
        const tip = main.find(id => id !== corner && cells[id] === null
          && clearLines.some(line => line !== main && line.includes(id)));
        if (tip !== undefined) return [corner, tip];
      }
    }
  }

  if (numberOfX === 4) {
    // O blocked the three-X line. Complete a rectangle off that line, making the
    // stem a new three-X threat and keeping the other two sides clear.
    for (const main of lines.filter(line => countX(line) === 3)) {
      for (const stem of clearLines.filter(line => countX(line) === 2)) {
        const corner = main.find(id => stem.includes(id));
        if (corner === undefined || cells[corner] !== 'X') continue;
        for (const side of clearLines.filter(line => countX(line) === 1)) {
          const tip = main.find(id => side.includes(id));
          if (tip === undefined || cells[tip] !== 'X') continue;
          for (const opposite of clearLines) {
            const first = stem.find(id => opposite.includes(id));
            const second = side.find(id => opposite.includes(id));
            if (first !== undefined && second !== undefined && first !== second
              && cells[first] === null && cells[second] === null) return [first, second];
          }
        }
      }
    }
  }

  if (numberOfX === 6) {
    // O blocked the new threat. Extend both remaining clear sides to three Xs;
    // their intersection is already X, so one O cannot block both threats.
    const pairs = clearLines.filter(line => countX(line) === 2);
    for (const first of pairs) {
      for (const second of pairs) {
        const corner = first.find(id => second.includes(id));
        if (first !== second && corner !== undefined && cells[corner] === 'X') {
          return [emptyIds(cells, first)[0], emptyIds(cells, second)[0]];
        }
      }
    }
  }

  // Unreachable from the empty board against any O play (the test sweeps it),
  // but a position outside the sequence still needs a legal turn.
  return randomXTurn(cells);
};

// The O solver. Only the rows and columns free of O matter to the outcome, and only through
// which of their empty cells they share. A position keeps, per O-free row, its
// count of empty cells in no O-free column and a bitmask of its empty cells in
// the O-free columns, and per O-free column its count of empty cells in no O-free
// row. Positions are canonicalised under row and column permutations and
// transposition, the game's symmetries, so the memo stays small.

interface OPosition {
  rows: [number, number][];
  columns: number[];
}

const outcomes = new Map<string, boolean>();
const canonicalPositions = new Map<string, OPosition>();
const permutationOrders = new Map<number, number[][]>();

const positionKey = ({ rows, columns }: OPosition) => JSON.stringify([rows, columns]);

const compareNumbers = (a: number[], b: number[]) => {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
};

const permutations = (size: number): number[][] => {
  const saved = permutationOrders.get(size);
  if (saved) return saved;
  const orders: number[][] = [];
  const visit = (order: number[]) => {
    if (order.length === size) orders.push(order);
    else range(size).filter(i => !order.includes(i)).forEach(i => visit([...order, i]));
  };
  visit([]);
  permutationOrders.set(size, orders);
  return orders;
};

const transpose = ({ rows, columns }: OPosition): OPosition => ({
  rows: columns.map((privateCount, c): [number, number] => [privateCount,
    rows.reduce((mask, row, r) => mask | (row[1] & (1 << c) ? 1 << r : 0), 0)]),
  columns: rows.map(([privateCount]) => privateCount)
});

const comparePositions = (a: OPosition, b: OPosition) =>
  compareNumbers([...a.rows.flat(), ...a.columns], [...b.rows.flat(), ...b.columns]);

const orient = ({ rows, columns }: OPosition): OPosition => {
  const signatures = columns.map((privateCount, c) =>
    [privateCount, rows.filter(([, mask]) => mask & (1 << c)).length]);
  let best: OPosition | undefined;
  for (const order of permutations(columns.length)) {
    if (order.some((c, i) => i > 0 && compareNumbers(signatures[order[i - 1]], signatures[c]) > 0)) continue;
    const candidate: OPosition = {
      rows: rows.map(([privateCount, mask]): [number, number] => [privateCount,
        order.reduce((result, c, i) => result | (mask & (1 << c) ? 1 << i : 0), 0)]).sort(compareNumbers),
      columns: order.map(c => columns[c])
    };
    if (!best || comparePositions(candidate, best) < 0) best = candidate;
  }
  return best!;
};

const canonical = (position: OPosition): OPosition => {
  const key = positionKey(position);
  const saved = canonicalPositions.get(key);
  if (saved) return saved;
  let result: OPosition;
  if (position.rows.length < position.columns.length) {
    result = canonical(transpose(position));
  } else {
    result = orient(position);
    if (position.rows.length === position.columns.length && position.rows.length > 0) {
      const transposed = orient(transpose(position));
      if (comparePositions(transposed, result) < 0) result = transposed;
    }
  }
  canonicalPositions.set(key, result);
  return result;
};

const toOPosition = (cells: Board['cells']): OPosition => {
  const ids = range(BOARD_SIZE);
  const rows = ids.filter(r => ids.every(c => cells[r * BOARD_SIZE + c] !== 'O'));
  const columns = ids.filter(c => ids.every(r => cells[r * BOARD_SIZE + c] !== 'O'));
  return canonical({
    rows: rows.map(r => [
      ids.filter(c => !columns.includes(c) && cells[r * BOARD_SIZE + c] === null).length,
      columns.reduce((mask, c, i) => mask | (cells[r * BOARD_SIZE + c] === null ? 1 << i : 0), 0)
    ]),
    columns: columns.map(c => ids.filter(r => !rows.includes(r) && cells[r * BOARD_SIZE + c] === null).length)
  });
};

// Empty cells left in each O-free line.
const lineSizes = ({ rows, columns }: OPosition) => [
  ...rows.map(([privateCount, mask]) => privateCount + columns.filter((_, c) => mask & (1 << c)).length),
  ...columns.map((privateCount, c) => privateCount + rows.filter(([, mask]) => mask & (1 << c)).length)
];

// The distinct places a mark can go: [row, column], with -1 for a cell whose
// other line is not O-free. Cells sharing such a coordinate are interchangeable.
const squares = ({ rows, columns }: OPosition): [number, number][] => [
  ...rows.flatMap(([privateCount, mask], r): [number, number][] => [
    ...(privateCount > 0 ? [[r, -1] as [number, number]] : []),
    ...columns.flatMap((_, c): [number, number][] => mask & (1 << c) ? [[r, c]] : [])
  ]),
  ...columns.flatMap((privateCount, c): [number, number][] => privateCount > 0 ? [[-1, c]] : [])
];

const placeIn = (position: OPosition, [r, c]: [number, number], isO: boolean): OPosition => {
  if (!isO) {
    const rows = position.rows.map(([privateCount, mask]): [number, number] => [privateCount, mask]);
    const columns = [...position.columns];
    if (r < 0) columns[c]--;
    else if (c < 0) rows[r][0]--;
    else rows[r][1] &= ~(1 << c);
    return canonical({ rows, columns });
  }
  // An O removes its row and column; their shared cells become private to the
  // crossing lines that stay O-free.
  return canonical({
    rows: position.rows.filter((_, i) => i !== r).map(([privateCount, mask]): [number, number] => c < 0
      ? [privateCount, mask]
      : [privateCount + Number(Boolean(mask & (1 << c))), (mask & ((1 << c) - 1)) | ((mask >> (c + 1)) << c)]),
    columns: position.columns.map((privateCount, j) => privateCount
      + Number(r >= 0 && Boolean(position.rows[r][1] & (1 << j)))).filter((_, j) => j !== c)
  });
};

// Whether O wins from `position` with `isO` to move, X placing two marks a turn.
const oWins = (position: OPosition, isO: boolean): boolean => {
  const key = (isO ? 'O' : 'X') + positionKey(position);
  const saved = outcomes.get(key);
  if (saved !== undefined) return saved;
  const sizes = lineSizes(position);
  let wins: boolean;
  if (sizes.length === 0) wins = true;
  else if (sizes.includes(0)) wins = false;
  else if (!isO && Math.min(...sizes) <= 2) wins = false;
  else if (isO) {
    // Every line X could complete next turn must be blocked by this one O.
    const urgent = sizes.flatMap((size, i) => size <= 2 ? [i] : []);
    wins = squares(position).some(([r, c]) => urgent.every(i => i === r || (c >= 0 && i === position.rows.length + c))
      && oWins(placeIn(position, [r, c], true), false));
  } else {
    wins = true;
    const seen = new Set<string>();
    search: for (const first of squares(position)) {
      const afterFirst = placeIn(position, first, false);
      for (const second of squares(afterFirst)) {
        const after = placeIn(afterFirst, second, false);
        const childKey = positionKey(after);
        if (seen.has(childKey)) continue;
        seen.add(childKey);
        if (!oWins(after, true)) {
          wins = false;
          break search;
        }
      }
    }
  }
  outcomes.set(key, wins);
  return wins;
};

export const oWinsAfter = (cells: Board['cells']) => oWins(toOPosition(cells), false);

// Against perfect X play every O loses, so pick the one hardest to answer: block
// the most three-X threats, then lines with two Xs, then lines with one, then
// prefer cells whose lines are still O-free.
const blockingO = (cells: Board['cells']): number => {
  const pairPriorities = [[2, 2], [2, 1], [1, 1], [2, 0], [1, 0], [0, 0]];
  const clearLines = linesWithoutO(cells);
  const priority = (id: number) => {
    const counts = clearLines.filter(line => line.includes(id))
      .map(line => line.filter(cell => cells[cell] === 'X').length)
      .sort((a, b) => b - a);
    const blockedThreats = counts.filter(count => count >= 3).length;
    const [first = 0, second = 0] = counts.map(count => Math.min(count, 2));
    const pairPriority = pairPriorities.length
      - pairPriorities.findIndex(([a, b]) => a === first && b === second);
    return blockedThreats * (pairPriorities.length + 1) * 3 + pairPriority * 3 + counts.length;
  };
  const empty = emptyIds(cells);
  const best = Math.max(...empty.map(priority));
  return sample(empty.filter(id => priority(id) === best))!;
};

const smartOMove = (cells: Board['cells']): number => {
  const winning = emptyIds(cells).filter(id => {
    const after = [...cells];
    after[id] = 'O';
    return oWinsAfter(after);
  });
  return winning.length > 0 ? sample(winning)! : blockingO(cells);
};

export const smartBotStrategy: Bot = ({ board, ctx }) =>
  markOf(board, ctx.currentPlayer!) === 'X'
    ? place(smartXTurn(board.cells))
    : place([smartOMove(board.cells)]);

// Random, except that X completes a line whenever it can.
export const randomBotStrategy: Bot = ({ board, ctx }) =>
  markOf(board, ctx.currentPlayer!) === 'X'
    ? place(completingXs(board.cells) ?? randomXTurn(board.cells))
    : place([sample(emptyIds(board.cells))!]);
