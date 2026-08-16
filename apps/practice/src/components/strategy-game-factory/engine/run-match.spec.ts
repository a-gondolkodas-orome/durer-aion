import type { BotStrategy, Ctx, Gameplay, MoveOutcome } from '../types';
import { runMatch } from './run-match';

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

// Same game played in two moves: name the amount, then take it.
const twoPhaseGame: Gameplay<Board> = {
  moves: {
    select: {
      apply: (board: Board, _meta, count: number) => ({ nextBoard: board, nextTurnState: { count } })
    },
    commit: {
      apply: (board: Board, { ctx }) =>
        takeStones(board, (ctx.turnState as { count: number }).count, ctx)
    }
  }
};

// Same game again, with the second move scheduled by the engine.
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

const takes = (count: number): BotStrategy<Board> => () => ({ move: 'take', args: [count] });

// Names the whole turn at once.
const takesInTwoPhases = (count: number): BotStrategy<Board> =>
  () => [{ move: 'select', args: [count] }, { move: 'commit' }];

// Names one move at a time, and is asked again while the turn is unfinished.
const takesPhaseByPhase = (count: number): BotStrategy<Board> =>
  ({ ctx }) => ctx.turnState === null ? { move: 'select', args: [count] } : { move: 'commit' };

describe('runMatch', () => {
  it('plays a game to the end and reports the winner', () => {
    const { winnerIndex, board } = runMatch({
      gameplay: singleMoveGame,
      strategies: [takes(1), takes(1)],
      startBoard: { stones: 5 }
    });

    expect(winnerIndex).toBe(0);
    expect(board).toEqual({ stones: 0 });
  });

  it('records every move with the board it produced', () => {
    const { history } = runMatch({
      gameplay: singleMoveGame,
      strategies: [takes(2), takes(1)],
      startBoard: { stones: 3 }
    });

    expect(history).toEqual([
      { player: 0, move: 'take', args: [2], board: { stones: 1 } },
      { player: 1, move: 'take', args: [1], board: { stones: 0 } }
    ]);
  });

  it('plays out a turn named as a whole', () => {
    const { winnerIndex, history } = runMatch({
      gameplay: twoPhaseGame,
      strategies: [takesInTwoPhases(1), takesInTwoPhases(1)],
      startBoard: { stones: 3 }
    });

    expect(winnerIndex).toBe(0);
    expect(history.map(h => [h.player, h.move])).toEqual([
      [0, 'select'], [0, 'commit'],
      [1, 'select'], [1, 'commit'],
      [0, 'select'], [0, 'commit']
    ]);
  });

  it('asks a strategy again while its move has not ended the turn', () => {
    const { winnerIndex, history } = runMatch({
      gameplay: twoPhaseGame,
      strategies: [takesPhaseByPhase(1), takesPhaseByPhase(1)],
      startBoard: { stones: 3 }
    });

    expect(winnerIndex).toBe(0);
    expect(history.map(h => h.move)).toEqual([
      'select', 'commit', 'select', 'commit', 'select', 'commit'
    ]);
  });

  it('runs the auto endOfTurnMove itself, with no delay to wait for', () => {
    const selects = (count: number): BotStrategy<Board> =>
      () => ({ move: 'select', args: [count] });

    const { winnerIndex, history } = runMatch({
      gameplay: autoEndOfTurnGame,
      strategies: [selects(2), selects(1)],
      startBoard: { stones: 3 }
    });

    expect(winnerIndex).toBe(1);
    expect(history.map(h => [h.player, h.move])).toEqual([
      [0, 'select'], [0, 'commit'],
      [1, 'select'], [1, 'commit']
    ]);
  });

  it('gives the strategy about to move the ctx of the computer player', () => {
    const seenRoles: (number | null)[] = [];
    const spy: BotStrategy<Board> = ({ ctx }) => {
      seenRoles.push(ctx.chosenRoleIndex);
      return { move: 'take', args: [1] };
    };

    runMatch({ gameplay: singleMoveGame, strategies: [spy, spy], startBoard: { stones: 3 } });

    // the seat to move is the bot, so the other seat is the notional human
    expect(seenRoles).toEqual([1, 0, 1]);
  });

  it('stops playing a named turn that has already won the game', () => {
    // names a second move it will not get to play: the first empties the board
    const overNames: BotStrategy<Board> = () =>
      [{ move: 'take', args: [1] }, { move: 'take', args: [1] }];

    const { winnerIndex, history } = runMatch({
      gameplay: singleMoveGame,
      strategies: [overNames, takes(1)],
      startBoard: { stones: 1 }
    });

    expect(winnerIndex).toBe(0);
    expect(history).toHaveLength(1);
  });

  it('throws when a strategy names moves after its turn ended', () => {
    const overNames: BotStrategy<Board> = () =>
      [{ move: 'take', args: [1] }, { move: 'take', args: [1] }];

    expect(() => runMatch({
      gameplay: singleMoveGame,
      strategies: [overNames, takes(1)],
      startBoard: { stones: 5 }
    })).toThrow(/named moves after take ended its turn/);
  });

  // A move name is only a string, so a typo survives typechecking and lands here.
  it('throws naming the moves that exist when a strategy names one that does not', () => {
    const typo: BotStrategy<Board> = () => ({ move: 'tkae', args: [1] });

    expect(() => runMatch({
      gameplay: singleMoveGame,
      strategies: [typo, takes(1)],
      startBoard: { stones: 5 }
    })).toThrow(/named unknown move 'tkae' \(this game has: take\)/);
  });

  it('throws on an illegal move instead of silently ignoring it', () => {
    expect(() => runMatch({
      gameplay: singleMoveGame,
      strategies: [takes(3), takes(1)],
      startBoard: { stones: 5 }
    })).toThrow(/illegal move take\(\[3\]\)/);
  });

  it('throws when a strategy names no move', () => {
    const passes: BotStrategy<Board> = () => [];

    expect(() => runMatch({
      gameplay: singleMoveGame,
      strategies: [takes(1), passes],
      startBoard: { stones: 5 }
    })).toThrow(/the strategy of player 1 named no move/);
  });

  it('throws when the game does not end within maxMoves', () => {
    const neverEnds: Gameplay<Board> = {
      moves: { idle: { apply: (board: Board) => ({ nextBoard: board, isTurnEnd: true }) } }
    };
    const idles: BotStrategy<Board> = () => ({ move: 'idle' });

    expect(() => runMatch({
      gameplay: neverEnds,
      strategies: [idles, idles],
      startBoard: { stones: 1 },
      maxMoves: 10
    })).toThrow(/no game end after 10 moves/);
  });
});
