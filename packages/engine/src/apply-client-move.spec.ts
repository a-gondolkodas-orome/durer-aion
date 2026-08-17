import type { Ctx, Gameplay, MoveOutcome } from './types';
import { applyClientMove } from './apply-client-move';
import { createInitialCoreState, type CoreState } from './store';

type Board = { stones: number }

const takeStones = (board: Board, count: number, ctx: Ctx): MoveOutcome<Board> => {
  const nextBoard = { stones: board.stones - count };
  if (nextBoard.stones === 0) {
    return { nextBoard, nextTurnState: null, gameEnd: { winnerIndex: ctx.currentPlayer! } };
  }
  return { nextBoard, nextTurnState: null, isTurnEnd: true };
};

// Take 1 or 2 stones; whoever takes the last one wins.
const singleMoveGame: Gameplay<Board> = {
  moves: {
    take: {
      validate: (board: Board, _meta, count: number) =>
        count >= 1 && count <= 2 && count <= board.stones,
      apply: (board: Board, { ctx }, count: number) => takeStones(board, count, ctx)
    }
  }
};

// The same game with the taking scheduled by the engine after a select.
const autoEndOfTurnGame: Gameplay<Board> = {
  moves: {
    select: {
      apply: (board: Board, _meta, count: number) =>
        ({ nextBoard: board, nextTurnState: { count }, autoEndOfTurn: true })
    },
    commit: {
      apply: (board: Board, { ctx }) =>
        takeStones(board, (ctx.turnState as { count: number }).count, ctx)
    }
  },
  endOfTurnMove: 'commit'
};

const inPlay = (stones: number, currentPlayer = 0): CoreState<Board> => ({
  ...createInitialCoreState<Board>({ stones }),
  phase: 'play',
  currentPlayer,
  chosenRoleIndex: currentPlayer
});

describe('applyClientMove', () => {
  it('applies a legal move and passes the turn', () => {
    const result = applyClientMove(inPlay(5), singleMoveGame, 'take', [2]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.board).toEqual({ stones: 3 });
    expect(result.state.currentPlayer).toBe(1);
    expect(result.playedMoves).toEqual([
      { player: 0, move: 'take', args: [2], board: { stones: 3 } }
    ]);
    expect(result.gameJustEnded).toBeUndefined();
  });

  it('reports the win when the move ends the game', () => {
    const result = applyClientMove(inPlay(2), singleMoveGame, 'take', [2]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.phase).toBe('gameEnd');
    expect(result.gameJustEnded).toEqual({ winnerIndex: 0 });
  });

  it('runs the auto endOfTurnMove to completion and reports it as played', () => {
    const result = applyClientMove(inPlay(3), autoEndOfTurnGame, 'select', [1]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.playedMoves.map(m => m.move)).toEqual(['select', 'commit']);
    expect(result.state.board).toEqual({ stones: 2 });
    expect(result.state.currentPlayer).toBe(1);
  });

  it('reports a win the auto endOfTurnMove caused', () => {
    const result = applyClientMove(inPlay(1), autoEndOfTurnGame, 'select', [1]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.gameJustEnded).toEqual({ winnerIndex: 0 });
  });

  it('rejects a move while the game is not in play', () => {
    expect(applyClientMove(createInitialCoreState<Board>({ stones: 5 }), singleMoveGame, 'take', [1]))
      .toEqual({ ok: false, rejection: 'notInPlay' });

    const ended: CoreState<Board> = { ...inPlay(5), phase: 'gameEnd', winnerIndex: 0 };
    expect(applyClientMove(ended, singleMoveGame, 'take', [1]))
      .toEqual({ ok: false, rejection: 'notInPlay' });
  });

  it("rejects a move on the other player's turn when told whose move it should be", () => {
    expect(applyClientMove(inPlay(5, 1), singleMoveGame, 'take', [1], { asPlayer: 0 }))
      .toEqual({ ok: false, rejection: 'notYourTurn' });
    expect(applyClientMove(inPlay(5, 1), singleMoveGame, 'take', [1], { asPlayer: 1 }).ok)
      .toBe(true);
  });

  it('rejects a move the game does not have', () => {
    expect(applyClientMove(inPlay(5), singleMoveGame, 'tkae', [1]))
      .toEqual({ ok: false, rejection: 'unknownMove' });
  });

  it('rejects a move its own validate refuses', () => {
    expect(applyClientMove(inPlay(5), singleMoveGame, 'take', [3]))
      .toEqual({ ok: false, rejection: 'illegalMove' });
  });

  it('leaves the given state untouched either way', () => {
    const state = inPlay(5);
    applyClientMove(state, singleMoveGame, 'take', [2]);
    applyClientMove(state, singleMoveGame, 'take', [3]);

    expect(state.board).toEqual({ stones: 5 });
    expect(state.currentPlayer).toBe(0);
  });

  // The auto move is the game's own, not the client's: failing there is a bug
  // in the game, and a server must hear about it rather than log a rejection.
  it('throws when the auto endOfTurnMove is itself illegal', () => {
    const brokenGame: Gameplay<Board> = {
      moves: {
        select: {
          apply: (board: Board) => ({ nextBoard: board, autoEndOfTurn: true })
        },
        commit: {
          validate: () => false,
          apply: (board: Board) => ({ nextBoard: board, isTurnEnd: true })
        }
      },
      endOfTurnMove: 'commit'
    };

    expect(() => applyClientMove(inPlay(3), brokenGame, 'select', []))
      .toThrow(/auto endOfTurnMove commit rejected/);
  });

  it('throws when endOfTurnMove names a move the game does not have', () => {
    const misconfigured: Gameplay<Board> = {
      moves: {
        select: { apply: (board: Board) => ({ nextBoard: board, autoEndOfTurn: true }) }
      },
      endOfTurnMove: 'commmit'
    };

    expect(() => applyClientMove(inPlay(3), misconfigured, 'select', []))
      .toThrow(/endOfTurnMove names unknown move 'commmit'/);
  });
});
