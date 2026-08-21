import { runMatch, type BotStrategy } from 'strategy-game-factory';
import { botNextMove, botNextMoveArgs, makeCtx } from 'test-utils';
import {
  POLICE, THIEF, THIEF_MOVE_LIMIT, VERTEX_COUNT, generateStartBoardA, generateStartBoardB,
  moves, neighbours, type Board
} from './gameplay';
import { policeWin, smartBotStrategy } from './bot-strategy';

// ---------------------------------------------------------------------------
// Independent reference, written straight from the rules: no memoisation and no
// code shared with the module under test, so the search is graded against
// something other than itself. `movesLeft` is how many of the thief's moves are
// still to come.
// ---------------------------------------------------------------------------
const refPoliceWinAfterPoliceTurn = (
  p0: number, p1: number, thief: number, movesLeft: number
): boolean => {
  if (p0 === thief || p1 === thief) return true;
  return neighbours[thief].every((vertex: number) => {
    if (vertex === p0 || vertex === p1) return true;
    if (movesLeft === 1) return false;
    return refPoliceWin(p0, p1, vertex, movesLeft - 1);
  });
};

const refPoliceWin = (p0: number, p1: number, thief: number, movesLeft: number): boolean =>
  neighbours[p0].some((a: number) =>
    neighbours[p1].some((b: number) => refPoliceWinAfterPoliceTurn(a, b, thief, movesLeft)));

const board = (
  policemen: [number, number], thief: number, turnCount = 0
): Board => ({ policemen, thief, turnCount, firstPolicemanMoved: false });

const movesLeftIn = (b: Board) => THIEF_MOVE_LIMIT - b.turnCount;

// Every position either side can be asked about: a capture has not happened yet
// and the thief still has a move to make.
const positions = (): Board[] => {
  const all: Board[] = [];
  for (let p0 = 0; p0 < VERTEX_COUNT; p0++) {
    for (let p1 = 0; p1 < VERTEX_COUNT; p1++) {
      for (let thief = 0; thief < VERTEX_COUNT; thief++) {
        if (thief === p0 || thief === p1) continue;
        for (let turnCount = 0; turnCount < THIEF_MOVE_LIMIT; turnCount++) {
          all.push(board([p0, p1], thief, turnCount));
        }
      }
    }
  }
  return all;
};

const startBoards = (generate: () => Board, samples = 600): Board[] => {
  const seen = new Map<string, Board>();
  for (let i = 0; i < samples; i++) {
    const b = generate();
    seen.set(`${b.policemen[0]},${b.policemen[1]},${b.thief}`, b);
  }
  return [...seen.values()];
};

const askBot = (b: Board, player: number) =>
  smartBotStrategy({ board: b, ctx: makeCtx({ currentPlayer: player }) });

// A police turn is named as two moves; read both destinations off it.
const namedPoliceTurn = (b: Board): [number, number] => {
  const named = askBot(b, POLICE) as { move: string, args?: unknown[] }[];
  expect(named.map(m => m.move)).toEqual(['moveFirstPoliceman', 'moveSecondPoliceman']);
  return [named[0]!.args![0] as number, named[1]!.args![0] as number];
};

const namedThiefVertex = (b: Board): number => botNextMoveArgs(askBot(b, THIEF))[0];

// A bot that just moves legally, to stand in for an opponent that does anything.
const randomBot: BotStrategy<Board> = ({ board: b, ctx }) => {
  const pick = (from: number) => neighbours[from][Math.floor(Math.random() * 3)];
  if (ctx.currentPlayer === THIEF) return { move: 'moveThief', args: [pick(b.thief)] };
  return [
    { move: 'moveFirstPoliceman', args: [pick(b.policemen[0]!)] },
    { move: 'moveSecondPoliceman', args: [pick(b.policemen[1]!)] }
  ];
};

const play = (startBoard: Board, strategies: [BotStrategy<Board>, BotStrategy<Board>]) =>
  runMatch({ gameplay: { moves }, strategies, startBoard });

describe('policeWin', () => {
  it('agrees with the independent reference on every position', () => {
    for (const b of positions()) {
      expect({ ...b, win: policeWin(b) }).toEqual({
        ...b,
        win: refPoliceWin(b.policemen[0]!, b.policemen[1]!, b.thief, movesLeftIn(b))
      });
    }
  });

  // The eight intersections are the corners of a cube, and `7 - v` is the corner
  // opposite v. With both policemen starting together (variant A) that is the
  // one place the thief cannot get away from: three roads lead out of it and the
  // two policemen, splitting up, cover them all.
  it('catches a thief at the opposite corner, and only there, when the police start together', () => {
    for (let police = 0; police < VERTEX_COUNT; police++) {
      for (let thief = 0; thief < VERTEX_COUNT; thief++) {
        if (thief === police || neighbours[police].includes(thief)) continue;
        expect({ police, thief, caught: policeWin(board([police, police], thief)) })
          .toEqual({ police, thief, caught: thief === VERTEX_COUNT - 1 - police });
      }
    }
  });

  it('catches a thief the two policemen already have surrounded', () => {
    expect(policeWin(board([1, 2], 0, 2))).toBe(true);
  });
});

describe('smartBotStrategy as the police', () => {
  it('names two legal steps, one per policeman', () => {
    for (const b of positions()) {
      const [first, second] = namedPoliceTurn(b);
      expect(neighbours[b.policemen[0]!]).toContain(first);
      expect(neighbours[b.policemen[1]!]).toContain(second);
    }
  });

  it('keeps the win from every position the police can win', () => {
    for (const b of positions()) {
      if (!refPoliceWin(b.policemen[0]!, b.policemen[1]!, b.thief, movesLeftIn(b))) continue;
      const [first, second] = namedPoliceTurn(b);
      const wins = refPoliceWinAfterPoliceTurn(first, second, b.thief, movesLeftIn(b));
      expect({ ...b, first, second, wins }).toEqual({ ...b, first, second, wins: true });
    }
  });
});

describe('smartBotStrategy as the thief', () => {
  it('names a legal step', () => {
    for (const b of positions()) {
      expect(neighbours[b.thief]).toContain(namedThiefVertex(b));
    }
  });

  it('keeps the escape from every position the thief can survive', () => {
    for (const b of positions()) {
      const movesLeft = movesLeftIn(b);
      // the police have just moved; the thief replies
      if (refPoliceWinAfterPoliceTurn(b.policemen[0]!, b.policemen[1]!, b.thief, movesLeft)) continue;
      const vertex = namedThiefVertex(b);
      const escapes = vertex !== b.policemen[0] && vertex !== b.policemen[1]
        && (movesLeft === 1 || !refPoliceWin(b.policemen[0]!, b.policemen[1]!, vertex, movesLeft - 1));
      expect({ ...b, vertex, escapes: true }).toEqual({ ...b, vertex, escapes });
    }
  });

  // The old greedy thief asked only whether a step was free right now and
  // whether it had any free neighbour, so it walked onto squares the police
  // could reach next turn — here, straight next to both of them.
  it('does not step next to the policemen when a safe road exists', () => {
    const b = board([5, 5], 3, 1);
    expect(namedThiefVertex(b)).not.toBe(7);
  });

  it('never walks into a policeman while any other road is open', () => {
    for (const b of positions()) {
      const vertex = namedThiefVertex(b);
      const openRoads = neighbours[b.thief]
        .filter((v: number) => v !== b.policemen[0] && v !== b.policemen[1]);
      if (openRoads.length) expect(openRoads).toContain(vertex);
    }
  });
});

describe('played out through the engine', () => {
  it('hands the win to the side the search names, in optimal-vs-optimal play', () => {
    for (const b of positions().filter(p => p.turnCount === 0)) {
      const { winnerIndex } = play(b, [smartBotStrategy, smartBotStrategy]);
      expect({ ...b, policeWins: policeWin(b) })
        .toEqual({ ...b, policeWins: winnerIndex === POLICE });
    }
  });

  it('wins against a bot moving at random, from every position it should', () => {
    for (const b of positions().filter(p => p.turnCount === 0)) {
      const winner = policeWin(b) ? POLICE : THIEF;
      const strategies: [BotStrategy<Board>, BotStrategy<Board>] = winner === POLICE
        ? [smartBotStrategy, randomBot]
        : [randomBot, smartBotStrategy];
      for (let trial = 0; trial < 6; trial++) {
        expect({ ...b, winner: play(b, strategies).winnerIndex }).toEqual({ ...b, winner });
      }
    }
  });
});

describe.each([
  ['A (together)', generateStartBoardA],
  ['B (apart)', generateStartBoardB]
])('start boards of variant %s', (_label, generate) => {
  const boards = startBoards(generate);

  it('never starts with the thief already caught or cornered', () => {
    for (const b of boards) {
      expect(b.turnCount).toBe(0);
      expect(b.policemen).not.toContain(b.thief);
      // the police must not be able to take them on the very first step
      expect(neighbours[b.policemen[0]!]).not.toContain(b.thief);
      expect(neighbours[b.policemen[1]!]).not.toContain(b.thief);
    }
  });

  it('gives both sides positions they can win', () => {
    const policeWinnable = boards.filter(policeWin).length;
    expect(policeWinnable).toBeGreaterThan(0);
    expect(policeWinnable).toBeLessThan(boards.length);
  });
});

describe('the bot names its whole turn', () => {
  it('gives the police both half-moves at once, and the thief a single move', () => {
    expect(askBot(board([0, 0], 7), POLICE)).toHaveLength(2);
    expect(botNextMove(askBot(board([0, 0], 7), THIEF)).move).toBe('moveThief');
  });
});
