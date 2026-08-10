import { range, uniq, cloneDeep } from 'lodash';
import { randomBotStrategy, smartBotStrategy } from './bot-strategy';
import { colors, startBoard, isAllowedStep, moves, type Board } from './gameplay';
import { botNextMoveArgs, makeCtx, moveValidator } from 'test-utils';

// This spec steps the board forward, so it needs its own copy of the shared one.
const freshStartBoard = () => cloneDeep(startBoard);

type Step = { vertex: number; color: string };

const boardWith = (colored: Record<number, string>): Board => {
  const board = freshStartBoard();
  Object.entries(colored).forEach(([vertex, color]) => { board[Number(vertex)] = color; });
  return board;
};

const isStepAllowed = moveValidator(moves.colorVertex);

// `ctx.chosenRoleIndex` is the role the *human* picked, so the bot takes the
// other seat: role 0 chosen by the human puts the bot second.
const asBotSecond = { chosenRoleIndex: 0 };
const asBotFirst = { chosenRoleIndex: 1 };

const stepNamed = (board: Board, seat: { chosenRoleIndex: number }): Step =>
  botNextMoveArgs(smartBotStrategy({ board, ctx: makeCtx(seat) }))[0];

// The first player wants all eight vertices coloured; the second wants the
// colouring to jam before that. The two seats therefore run different
// strategies, and neither is a search.
describe('smartBotStrategy as the first player', () => {
  it('opens on the main diagonal, taking both its ends before anything else', () => {
    const seen = uniq(range(40).map(() => stepNamed(freshStartBoard(), asBotFirst).vertex));
    expect(seen.sort()).toEqual([2, 4]);
  });

  it('moves off the diagonal only once both its ends are taken', () => {
    const board = boardWith({ 2: 'red', 4: 'blue' });
    const seen = uniq(range(60).map(() => stepNamed(board, asBotFirst).vertex));

    expect(seen.sort((a, b) => a - b)).toEqual([0, 1, 3, 5, 6, 7]);
  });

  it('names a colour the vertex may actually take', () => {
    const board = boardWith({ 2: 'red' });
    for (const { vertex, color } of range(20).map(() => stepNamed(board, asBotFirst))) {
      expect(isAllowedStep(board, vertex, color)).toBe(true);
    }
  });
});

describe('smartBotStrategy as the second player', () => {
  it('jams a vertex outright when it can', () => {
    // Vertices 1 and 3 are neighbours of both 0 and 2, so each of those is one
    // colour short of being stuck; giving that colour to a free neighbour
    // finishes the job and the second player wins.
    const board = boardWith({ 1: 'red', 3: 'blue' });

    for (const step of range(20).map(() => stepNamed(board, asBotSecond))) {
      expect(step.color).toBe('yellow');
      expect(isStepAllowed(board, step)).toBe(true);

      const next = moves.colorVertex.apply(board, { ctx: makeCtx() }, step).nextBoard;
      const jammed = range(8).filter(v =>
        next[v] === '' && colors.every(color => !isAllowedStep(next, v, color)));
      expect(jammed.length).toBeGreaterThan(0);
    }
  });

  it.each([[0, 6], [1, 7], [3, 5]])(
    'answers the first player\'s vertex %i by copying its colour onto %i',
    (played, answer) => {
      // Off the main diagonal the two vertices of a pair are never adjacent, so
      // the same colour fits — and the copy keeps the position symmetric.
      const board = boardWith({ [played]: 'red' });
      const seen = uniq(range(20).map(() => JSON.stringify(stepNamed(board, asBotSecond))));

      expect(seen).toEqual([JSON.stringify({ vertex: answer, color: 'red' })]);
    });

  it('still names an allowed step when neither answer applies', () => {
    // The first player opened on the main diagonal, so there is no pair to
    // copy, and nothing is one colour short of jamming yet.
    const board = boardWith({ 2: 'red' });

    for (const step of range(20).map(() => stepNamed(board, asBotSecond))) {
      expect(isStepAllowed(board, step)).toBe(true);
    }
  });
});

describe('legality from either seat', () => {
  it('only ever names a colouring the game accepts', () => {
    const boards = [
      freshStartBoard(),
      boardWith({ 2: 'red' }),
      boardWith({ 0: 'red' }),
      boardWith({ 1: 'red', 3: 'blue' }),
      boardWith({ 2: 'red', 4: 'blue' }),
      boardWith({ 0: 'red', 6: 'red', 2: 'blue' }),
      boardWith({ 0: 'red', 6: 'red', 1: 'blue', 7: 'blue' })
    ];

    const illegal = boards.flatMap(board =>
      [asBotFirst, asBotSecond].flatMap(seat =>
        range(20)
          .map(() => stepNamed(board, seat))
          .filter(step => !isStepAllowed(board, step))
          .map(step => `${JSON.stringify(board)} ${JSON.stringify(seat)} -> ${JSON.stringify(step)}`)));

    expect(uniq(illegal)).toEqual([]);
  });
});

describe('randomBotStrategy', () => {
  it('draws only from the allowed colourings', () => {
    const board = boardWith({ 0: 'red', 2: 'blue' });
    const illegal = range(60)
      .map(() => botNextMoveArgs(randomBotStrategy({ board, ctx: makeCtx() }))[0])
      .filter(step => !isStepAllowed(board, step));

    expect(illegal).toEqual([]);
  });
});
