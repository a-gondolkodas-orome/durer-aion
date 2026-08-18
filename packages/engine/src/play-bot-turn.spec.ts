import type { BotStrategy, Ctx, Gameplay, MoveOutcome } from './types';
import { playBotTurn } from './play-bot-turn';
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

const inPlay = (stones: number, currentPlayer = 0): CoreState<Board> => ({
  ...createInitialCoreState<Board>({ stones }),
  phase: 'play',
  currentPlayer,
  // the notional human holds the other seat
  chosenRoleIndex: 1 - currentPlayer
});

describe('playBotTurn', () => {
  it('plays one turn and hands the turn to the other player', () => {
    const { state, moves } = playBotTurn(inPlay(5), singleMoveGame, takes(2));

    expect(moves).toEqual([{ player: 0, move: 'take', args: [2], board: { stones: 3 } }]);
    expect(state.currentPlayer).toBe(1);
    expect(state.phase).toBe('play');
  });

  it('plays a whole turn named as one plan', () => {
    const plansTurn: BotStrategy<Board> = () =>
      [{ move: 'select', args: [1] }, { move: 'commit' }];

    const { state, moves } = playBotTurn(inPlay(3), twoPhaseGame, plansTurn);

    expect(moves.map(m => m.move)).toEqual(['select', 'commit']);
    expect(state.board).toEqual({ stones: 2 });
    expect(state.currentPlayer).toBe(1);
  });

  it('asks the strategy again while its move has not ended the turn', () => {
    const phaseByPhase: BotStrategy<Board> = ({ ctx }) =>
      ctx.turnState === null ? { move: 'select', args: [1] } : { move: 'commit' };

    const { moves } = playBotTurn(inPlay(3), twoPhaseGame, phaseByPhase);

    expect(moves.map(m => m.move)).toEqual(['select', 'commit']);
  });

  it('runs the auto endOfTurnMove itself and reports it as a played move', () => {
    const selects: BotStrategy<Board> = () => ({ move: 'select', args: [1] });

    const { state, moves } = playBotTurn(inPlay(3), autoEndOfTurnGame, selects);

    expect(moves.map(m => [m.player, m.move])).toEqual([[0, 'select'], [0, 'commit']]);
    expect(state.board).toEqual({ stones: 2 });
  });

  it('reports the win and stops when its move ends the game', () => {
    const { state, moves } = playBotTurn(inPlay(2), singleMoveGame, takes(2));

    expect(state.phase).toBe('gameEnd');
    expect(state.winnerIndex).toBe(0);
    expect(moves).toHaveLength(1);
  });

  it('drops the planned moves a mid-turn win made moot', () => {
    const overNames: BotStrategy<Board> = () =>
      [{ move: 'take', args: [2] }, { move: 'take', args: [1] }];

    const { state, moves } = playBotTurn(inPlay(2), singleMoveGame, overNames);

    expect(state.winnerIndex).toBe(0);
    expect(moves).toHaveLength(1);
  });

  it('plays the seat that is to move, not always seat 0', () => {
    const { state, moves } = playBotTurn(inPlay(5, 1), singleMoveGame, takes(1));

    expect(moves).toEqual([{ player: 1, move: 'take', args: [1], board: { stones: 4 } }]);
    expect(state.currentPlayer).toBe(0);
  });

  it('throws when the game is not in play', () => {
    expect(() => playBotTurn(createInitialCoreState<Board>({ stones: 5 }), singleMoveGame, takes(1)))
      .toThrow(/not in play/);
  });

  it('throws when the strategy names moves after its turn ended', () => {
    const overNames: BotStrategy<Board> = () =>
      [{ move: 'take', args: [1] }, { move: 'take', args: [1] }];

    expect(() => playBotTurn(inPlay(5), singleMoveGame, overNames))
      .toThrow(/named moves after take ended its turn/);
  });

  it('throws naming the moves that exist when the strategy names one that does not', () => {
    const typo: BotStrategy<Board> = () => ({ move: 'tkae', args: [1] });

    expect(() => playBotTurn(inPlay(5), singleMoveGame, typo))
      .toThrow(/named unknown move 'tkae' \(this game has: take\)/);
  });

  it('throws on an illegal move instead of silently ignoring it', () => {
    expect(() => playBotTurn(inPlay(5), singleMoveGame, takes(3)))
      .toThrow(/illegal move take\(\[3\]\)/);
  });

  it('throws when the strategy names no move', () => {
    const passes: BotStrategy<Board> = () => [];

    expect(() => playBotTurn(inPlay(5), singleMoveGame, passes))
      .toThrow(/the strategy of player 0 named no move/);
  });

  it('throws when the turn never closes instead of looping forever', () => {
    const stalls: Gameplay<Board> = {
      moves: { ponder: { apply: (board: Board) => ({ nextBoard: board }) } }
    };
    const ponders: BotStrategy<Board> = () => ({ move: 'ponder' });

    expect(() => playBotTurn(inPlay(5), stalls, ponders, { maxMoves: 10 }))
      .toThrow(/turn still open after 10 moves/);
  });
});
