import { describe, expect, it } from 'vitest';
import { applyEvent, createCompetitionMatchState } from 'competition';
import type { CompetitionMatchState } from 'competition';
import type { CompetitionGame } from 'games/server';
import { applyTeamEventWithBotReplies } from './strategy-v2-core';

// A Nim of one pile: take 1 or 2 stones, taking the last one wins. Small
// enough to script, rich enough to end games from either seat.
interface Board { stones: number }

const game: CompetitionGame<Board> = {
  gameId: 'StubNim',
  gameplay: {
    moves: {
      take: {
        validate: (board: Board, _: unknown, count: number) =>
          Number.isInteger(count) && count >= 1 && count <= 2 && count <= board.stones,
        apply: (board: Board, { ctx }: any, count: number) => {
          const nextBoard = { stones: board.stones - count };
          if (nextBoard.stones === 0) return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer } };
          return { nextBoard, isTurnEnd: true };
        },
      },
    },
  },
  // Distinguishable on purpose, so a test can see which one answered.
  liveBot: ({ board }) => ({ move: 'take', args: [Math.min(2, board.stones)] }),
  testBot: () => ({ move: 'take', args: [1] }),
  liveStartBoardsByCategory: {
    C: [{ stones: 3 }, { stones: 4 }, { stones: 5 }, { stones: 6 }],
  },
  generateTestStartBoard: () => ({ stones: 9 }),
};

const NOW = '2026-02-01T10:00:00.000Z';
type State = CompetitionMatchState<Board>;

const newMatch = (): State =>
  createCompetitionMatchState({ gameId: 'StubNim', category: 'C', startAt: NOW });

const applied = (state: State, wire: unknown) => {
  const outcome = applyTeamEventWithBotReplies(state, wire, game, 'C', NOW);
  if (!outcome.ok) throw new Error(`rejected: ${outcome.rejection}`);
  return outcome;
};

const attemptOf = (state: State) => {
  if (!state.attempt) throw new Error('expected an attempt on the state');
  return state.attempt;
};

const rejectionOf = (state: State, wire: unknown) => {
  const outcome = applyTeamEventWithBotReplies(state, wire, game, 'C', NOW);
  return outcome.ok ? 'applied' : outcome.rejection;
};

describe('wire-event validation', () => {
  it.each([
    ['not an object', 42],
    ['unknown type', { type: 'RESIGN' }],
    ['bad difficulty', { type: 'START_ATTEMPT', difficulty: 'hard' }],
    ['bad role', { type: 'CHOOSE_ROLE', roleIndex: 2 }],
    ['move without args', { type: 'MOVE', name: 'take' }],
  ])('refuses %s as malformed', (_name, wire) => {
    expect(rejectionOf(newMatch(), wire)).toBe('malformedEvent');
  });

  it('a team cannot smuggle server-owned fields: the board and clock are stamped here', () => {
    const outcome = applied(newMatch(), {
      type: 'START_ATTEMPT', difficulty: 'live', board: { stones: 1 }, at: '1999-01-01T00:00:00Z',
    });
    // the hand-out policy's board and the server's clock, not the wire's
    expect(attemptOf(outcome.state).core.board).toEqual({ stones: 3 });
    expect((outcome.appended[0]?.payload as { at: string }).at).toBe(NOW);
  });
});

describe('the hand-out', () => {
  it('a live attempt starts from the curated list by the tally', () => {
    const fresh = applied(newMatch(), { type: 'START_ATTEMPT', difficulty: 'live' });
    expect(attemptOf(fresh.state)).toMatchObject({ startBoardIndex: 0, core: { board: { stones: 3 } } });

    // one loss on the tally moves the hand-out to the next pair
    const afterLoss = { ...newMatch(), tally: { tries: 1, losses: 1, streak: 0, points: 0 } };
    const retried = applied(afterLoss, { type: 'START_ATTEMPT', difficulty: 'live' });
    expect(attemptOf(retried.state)).toMatchObject({ startBoardIndex: 2, core: { board: { stones: 5 } } });
  });

  it('a test attempt is generated, with no hand-out index', () => {
    const outcome = applied(newMatch(), { type: 'START_ATTEMPT', difficulty: 'test' });
    expect(attemptOf(outcome.state)).toMatchObject({ startBoardIndex: null, core: { board: { stones: 9 } } });
  });
});

describe('the bot answers within the request', () => {
  const inPlay = (roleIndex: number, difficulty: 'test' | 'live' = 'live'): State => {
    const state = applied(newMatch(), { type: 'START_ATTEMPT', difficulty }).state;
    const chosen = applyEvent(state, { type: 'CHOOSE_ROLE', at: NOW, roleIndex }, game.gameplay);
    if (!chosen.ok) throw new Error(chosen.rejection);
    return chosen.state;
  };

  it('after the team moves, the bot replies and hands the turn back', () => {
    const outcome = applied(inPlay(0), { type: 'MOVE', name: 'take', args: [1] });
    // 3 stones: team takes 1, the live bot takes min(2, 2) and wins
    expect(outcome.botEvents).toEqual([
      { type: 'MOVE', at: NOW, actor: 'bot', name: 'take', args: [2] },
    ]);
    expect(attemptOf(outcome.state).core).toMatchObject({ phase: 'gameEnd', winnerIndex: 1 });
    expect(outcome.state.tally).toMatchObject({ losses: 1, streak: 0 });
    expect(outcome.appended.map(event => event.actor)).toEqual(['team', 'bot']);
  });

  it('a test attempt is answered by the test bot', () => {
    const outcome = applied(inPlay(0, 'test'), { type: 'MOVE', name: 'take', args: [1] });
    // 9 stones: team takes 1, test bot takes 1 — not the live bot's 2
    expect(outcome.botEvents).toEqual([
      { type: 'MOVE', at: NOW, actor: 'bot', name: 'take', args: [1] },
    ]);
    expect(attemptOf(outcome.state).core.board).toEqual({ stones: 7 });
  });

  it("the team's winning move gets no bot reply", () => {
    let state = inPlay(0);
    state = applied(state, { type: 'MOVE', name: 'take', args: [1] }).state;
    // that attempt ended (bot won); start again: pair 1 → 5 stones
    state = applied(state, { type: 'START_ATTEMPT', difficulty: 'live' }).state;
    const chosen = applyEvent(state, { type: 'CHOOSE_ROLE', at: NOW, roleIndex: 0 }, game.gameplay);
    if (!chosen.ok) throw new Error(chosen.rejection);
    state = applied(chosen.state, { type: 'MOVE', name: 'take', args: [1] }).state; // 4 left
    // bot took 2 → 2 left; team takes 2 and wins
    const winning = applied(state, { type: 'MOVE', name: 'take', args: [2] });
    expect(winning.botEvents).toEqual([]);
    expect(attemptOf(winning.state).core).toMatchObject({ phase: 'gameEnd', winnerIndex: 0 });
    expect(winning.state.tally.streak).toBe(1);
  });

  it("relays the engine's rejections for a bad team move", () => {
    expect(rejectionOf(inPlay(0), { type: 'MOVE', name: 'take', args: [5] })).toBe('illegalMove');
    expect(rejectionOf(inPlay(0), { type: 'MOVE', name: 'nope', args: [] })).toBe('unknownMove');
  });
});

describe('choosing the bot seat first', () => {
  it('the bot opens the game and the team is on turn in the returned state', () => {
    const started = applied(newMatch(), { type: 'START_ATTEMPT', difficulty: 'live' }).state;
    const outcome = applied(started, { type: 'CHOOSE_ROLE', roleIndex: 1 });
    // team took seat 1, so the bot (seat 0) opened: 3 stones minus its 2
    expect(outcome.botEvents).toHaveLength(1);
    expect(attemptOf(outcome.state).core).toMatchObject({
      board: { stones: 1 }, currentPlayer: 1,
    });
  });
});
