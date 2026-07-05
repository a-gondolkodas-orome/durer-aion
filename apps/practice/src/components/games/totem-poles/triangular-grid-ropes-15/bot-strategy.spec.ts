import { sample } from 'lodash';
import { getAllowedMoves, getAllowedSuperset, type Board, type Edge } from './helpers';
import { findWinningMove } from './solver';
import { smartBotStrategy } from './bot-strategy';
import { makeCtx } from '../../../game-factory';

// Play a full game. Player 0 is the opponent, player 1 is the smart bot (the
// second player, who has the winning strategy). Returns the index of the player
// who is left unable to move (the loser).
const playGame = (opponentMove: (b: Board) => Edge, firstMove?: Edge): number => {
  let board: Board = [];
  let player = 0;
  while (getAllowedMoves(board).length > 0) {
    let move: Edge;
    if (player === 0) {
      move = board.length === 0 && firstMove ? firstMove : opponentMove(board);
    } else {
      move = findWinningMove(board) ?? sample(getAllowedMoves(board))!;
    }
    board = [...board, getAllowedSuperset(board, move)!];
    player = 1 - player;
  }
  return player; // the player to move who cannot move loses
};

const randomMove = (board: Board): Edge => sample(getAllowedMoves(board))!;

describe('smart bot (second player) is optimal', () => {
  it('always wins against a random opponent', () => {
    for (let game = 0; game < 30; game++) {
      expect(playGame(randomMove)).toBe(0); // opponent (player 0) always loses
    }
  }, 20000);

  it('wins regardless of the opponent opening', () => {
    for (const opening of getAllowedMoves([])) {
      // force the given opening, then let the opponent play randomly
      expect(playGame(randomMove, opening)).toBe(0);
    }
  }, 20000);

  it('wins against a deterministic opponent that always takes the first legal rope', () => {
    const firstMove = (board: Board): Edge => getAllowedMoves(board)[0];
    expect(playGame(firstMove)).toBe(0);
  });
});

describe('findWinningMove', () => {
  it('returns a legal move from a winning position', () => {
    const board: Board = [{ from: 3, to: 5 }]; // opponent opened; bot to move and winning
    const move = findWinningMove(board);
    expect(move).not.toBeNull();
    expect(getAllowedMoves(board)).toContainEqual(getAllowedSuperset(board, move!));
  });

  it('reports a lost position (the first player from the empty board cannot force a win)', () => {
    // after the bot (as 2nd player) makes its winning reply, the opponent is to
    // move in a losing position, so from that opponent view no winning move exists
    const board: Board = [{ from: 3, to: 5 }];
    const botReply = findWinningMove(board)!;
    const afterBot: Board = [...board, getAllowedSuperset(board, botReply)!];
    expect(findWinningMove(afterBot)).toBeNull();
  });
});

describe('smartBotStrategy', () => {
  it('plays a legal opening move when it is the first player', () => {
    let played: Edge | null = null;
    smartBotStrategy({
      board: [],
      ctx: makeCtx({ currentPlayer: 0 }),
      moves: { stretchRope: (_b: Board, move: Edge) => { played = move; return { nextBoard: [] }; } }
    });
    expect(played).not.toBeNull();
  });
});
