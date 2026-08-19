import { canonicalize, firstPlayerMove, heuristicMove } from './bot-strategy';
import { boardMasks, emptyCells, generateEmptyBoard, hasLine, CELL_COUNT } from './gameplay';
import { LINES, SYMMETRIES } from './board-data';

const applyPerm = (mask: number, perm: number[]): number => {
  let result = 0;
  for (let i = 0; i < CELL_COUNT; i++) if (mask & (1 << i)) result |= 1 << perm[i];
  return result;
};

describe('modified mill bot strategy', () => {
  it('the first-player table wins against every possible second-player line', () => {
    // Exhaustive proof of optimality (and that the JS canonical lookup matches the
    // offline solver): the bot plays first via firstPlayerMove, the opponent tries
    // every legal reply. The bot must always complete a line before the board
    // fills and the opponent must never complete one.
    let botWins = 0;
    let opponentWins = 0;
    let fullBoards = 0;

    const play = (red: number, blue: number) => {
      const move = firstPlayerMove(red, blue);
      expect((red & (1 << move)) === 0 && (blue & (1 << move)) === 0).toBe(true); // legal
      const nextRed = red | (1 << move);
      if (hasLine(nextRed)) {
        botWins++;
        return;
      }
      const replies = emptyCells(nextRed, blue);
      if (replies.length === 0) {
        fullBoards++;
        return;
      }
      for (const reply of replies) {
        const nextBlue = blue | (1 << reply);
        if (hasLine(nextBlue)) {
          opponentWins++; // must never happen
          continue;
        }
        play(nextRed, nextBlue);
      }
    };

    play(0, 0);
    expect(botWins).toBeGreaterThan(0);
    expect(opponentWins).toBe(0);
    expect(fullBoards).toBe(0);
  });

  it('the first-player bot never needs more than a handful of moves to win', () => {
    // Depth-bound sanity: follow one greedy opponent line and confirm the bot
    // completes a line quickly rather than dragging to a full board.
    let red = 0;
    let blue = 0;
    let botMoves = 0;
    for (let i = 0; i < CELL_COUNT; i++) {
      const move = firstPlayerMove(red, blue);
      red |= 1 << move;
      botMoves++;
      if (hasLine(red)) break;
      // opponent plays its heuristic reply
      const reply = heuristicMove(blue, red);
      blue |= 1 << reply;
    }
    expect(hasLine(red)).toBe(true);
    expect(botMoves).toBeLessThanOrEqual(12);
  });

  it('the heuristic takes an immediate win when offered', () => {
    // blue has two of a line; the third cell is empty -> heuristic must take it.
    const line = [0, 4, 1]; // LINES[0]
    const blue = (1 << line[0]) | (1 << line[1]);
    const red = 0;
    expect(heuristicMove(blue, red)).toBe(line[2]);
  });

  it('the heuristic blocks an immediate opponent threat', () => {
    // red threatens to complete a line; blue has no win, so it must block.
    const line = [0, 4, 1];
    const red = (1 << line[0]) | (1 << line[1]);
    const blue = 1 << 12; // an unrelated blue disc, no blue win available
    expect(heuristicMove(blue, red)).toBe(line[2]);
  });
});

describe('canonicalisation', () => {
  it('canonicalize gives every symmetric image of a position the same key', () => {
    const board = generateEmptyBoard();
    board[LINES[0][0]] = 'red';
    board[LINES[3][1]] = 'blue';
    board[LINES[7][2]] = 'red';
    const { red, blue } = boardMasks(board);
    const base = canonicalize(red, blue).key;

    // Applying any of the 8 board symmetries must not change the canonical key.
    for (const perm of SYMMETRIES) {
      expect(canonicalize(applyPerm(red, perm), applyPerm(blue, perm)).key).toBe(base);
    }
  });
});
