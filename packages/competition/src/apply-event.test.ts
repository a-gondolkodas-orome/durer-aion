import { describe, expect, it } from 'vitest';
import type { Gameplay } from 'engine';
import {
  applyEvent, createCompetitionMatchState, pointsForSecondWin
} from './apply-event';
import type { CompetitionEvent, CompetitionMatchState } from './types';

type Board = { moved: number }

// A game reduced to what the competition layer reads off it: `resolve` ends
// the game naming a winner, `pass` hands the turn over, `never` is always
// illegal.
const gameplay: Gameplay<Board> = {
  moves: {
    resolve: {
      apply: (board, _: unknown, winnerIndex: number) => ({ nextBoard: board, gameEnd: { winnerIndex } })
    },
    pass: {
      apply: (board) => ({ nextBoard: { moved: board.moved + 1 }, isTurnEnd: true })
    },
    never: {
      validate: () => false,
      apply: (board) => ({ nextBoard: board, isTurnEnd: true })
    }
  }
};

const START_AT = '2026-02-01T10:00:00.000Z';
// minutes (fractional for seconds) after the match started
const at = (minutes: number) =>
  new Date(new Date(START_AT).getTime() + minutes * 60 * 1000).toISOString();

const newMatch = () => createCompetitionMatchState<Board>({
  gameId: 'TestGame', category: 'C', startAt: START_AT
});

type Match = CompetitionMatchState<Board>

// Folds events, asserting each applied — for building positions, not for
// asserting rejections.
const play = (state: Match, ...events: CompetitionEvent<Board>[]): Match =>
  events.reduce((current, event) => {
    const result = applyEvent(current, event, gameplay);
    if (!result.ok) throw new Error(`event ${event.type} rejected: ${result.rejection}`);
    return result.state;
  }, state);

const startAttempt = (difficulty: 'test' | 'live', minute = 1): CompetitionEvent<Board>[] => [
  { type: 'START_ATTEMPT', at: at(minute), difficulty, board: { moved: 0 } },
  { type: 'CHOOSE_ROLE', at: at(minute), roleIndex: 0 }
];

const teamResolves = (winnerIndex: number, minute = 2): CompetitionEvent<Board> =>
  ({ type: 'MOVE', at: at(minute), actor: 'team', name: 'resolve', args: [winnerIndex] });

const liveAttempt = (state: Match, teamWins: boolean, minute = 1): Match =>
  play(state, ...startAttempt('live', minute), teamResolves(teamWins ? 0 : 1, minute));

describe('createCompetitionMatchState', () => {
  it('opens a 30-minute clock and an empty tally', () => {
    const state = newMatch();
    expect(state.clock).toEqual({ startAt: START_AT, endAt: at(30) });
    expect(state.tally).toEqual({ tries: 0, losses: 0, streak: 0, points: 0 });
    expect(state.attempt).toBeNull();
    expect(state.finished).toBe(false);
  });
});

describe('attempt flow', () => {
  it('walks start → role choice → play, counting only live tries', () => {
    let state = play(newMatch(),
      { type: 'START_ATTEMPT', at: at(1), difficulty: 'live', board: { moved: 0 }, startBoardIndex: 0 });
    expect(state.tally.tries).toBe(1);
    expect(state.attempt).toMatchObject({
      difficulty: 'live', roleIndex: null, startBoardIndex: 0, core: { phase: 'roleSelection' }
    });

    state = play(state, { type: 'CHOOSE_ROLE', at: at(1), roleIndex: 1 });
    expect(state.attempt!.roleIndex).toBe(1);
    expect(state.attempt!.core).toMatchObject({ phase: 'play', currentPlayer: 0, chosenRoleIndex: 1 });
  });

  it('a test attempt counts no try', () => {
    const state = play(newMatch(),
      { type: 'START_ATTEMPT', at: at(1), difficulty: 'test', board: { moved: 0 } });
    expect(state.tally.tries).toBe(0);
    expect(state.attempt!.startBoardIndex).toBeNull();
  });

  it('alternates the seats through team and bot moves', () => {
    let state = play(newMatch(), ...startAttempt('live'));
    state = play(state, { type: 'MOVE', at: at(2), actor: 'team', name: 'pass', args: [] });
    expect(state.attempt!.core.currentPlayer).toBe(1);
    state = play(state, { type: 'MOVE', at: at(2), actor: 'bot', name: 'pass', args: [] });
    expect(state.attempt!.core.currentPlayer).toBe(0);
    expect(state.attempt!.core.board).toEqual({ moved: 2 });
  });
});

describe('scoring', () => {
  it('finishes with full points on two straight live wins', () => {
    let state = liveAttempt(newMatch(), true);
    expect(state.tally).toMatchObject({ streak: 1, points: 0 });
    expect(state.finished).toBe(false);

    state = liveAttempt(state, true, 3);
    expect(state.tally).toMatchObject({ tries: 2, losses: 0, streak: 2, points: 12 });
    expect(state.finished).toBe(true);
  });

  it('a loss resets the streak and counts', () => {
    let state = liveAttempt(newMatch(), true);
    state = liveAttempt(state, false, 3);
    expect(state.tally).toMatchObject({ tries: 2, losses: 1, streak: 0, points: 0 });
    expect(state.finished).toBe(false);
  });

  it('a test game moves no tally whoever wins', () => {
    let state = play(newMatch(), ...startAttempt('test'), teamResolves(1));
    state = play(state, ...startAttempt('test', 3), teamResolves(0, 3));
    expect(state.tally).toEqual({ tries: 0, losses: 0, streak: 0, points: 0 });
    expect(state.finished).toBe(false);
  });

  it('the ladder pays by prior losses and floors at 2', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 9].map(pointsForSecondWin)).toEqual([12, 9, 6, 4, 3, 2, 2, 2]);
  });

  it("the bot's winning move scores the loss too", () => {
    const state = play(newMatch(), ...startAttempt('live'),
      { type: 'MOVE', at: at(2), actor: 'team', name: 'pass', args: [] },
      { type: 'MOVE', at: at(2), actor: 'bot', name: 'resolve', args: [1] });
    expect(state.tally).toMatchObject({ losses: 1, streak: 0 });
    expect(state.attempt!.core).toMatchObject({ phase: 'gameEnd', winnerIndex: 1 });
  });
});

describe('the clock', () => {
  it('lets a move through within the 10-second grace', () => {
    const state = play(newMatch(), ...startAttempt('live'), teamResolves(0, 30 + 9 / 60));
    expect(state.tally.streak).toBe(1);
    expect(state.finished).toBe(false);
  });

  it('a team move beyond the grace still lands, then the match closes', () => {
    // The winning move itself counts — the old wrapper applied the move
    // before its onMove hook closed the match — so a second-in-a-row win
    // completed 11 seconds late still banks its points.
    let state = liveAttempt(newMatch(), true);
    state = play(state, ...startAttempt('live', 3), teamResolves(0, 30 + 11 / 60));
    expect(state.tally).toMatchObject({ streak: 2, points: 12 });
    expect(state.finished).toBe(true);

    const nonWinning = play(newMatch(), ...startAttempt('live'),
      { type: 'MOVE', at: at(30 + 11 / 60), actor: 'team', name: 'pass', args: [] });
    expect(nonWinning.attempt!.core.board).toEqual({ moved: 1 });
    expect(nonWinning.finished).toBe(true);
  });

  it("the bot's side has no grace: its move at the horn is the last", () => {
    const state = play(newMatch(), ...startAttempt('live'),
      { type: 'MOVE', at: at(29), actor: 'team', name: 'pass', args: [] },
      { type: 'MOVE', at: at(30), actor: 'bot', name: 'pass', args: [] });
    expect(state.finished).toBe(true);
  });

  it('ADD_MINUTES pushes the horn out, turning a late move timely', () => {
    let state = play(newMatch(), ...startAttempt('live'),
      { type: 'ADD_MINUTES', at: at(20), minutes: 5 });
    expect(state.clock.endAt).toBe(at(35));
    state = play(state, teamResolves(0, 34));
    expect(state.finished).toBe(false);
    expect(state.tally.streak).toBe(1);
  });

  it('CLOSE finishes the match and closing twice is a no-op', () => {
    const state = play(newMatch(), { type: 'CLOSE', at: at(10) });
    expect(state.finished).toBe(true);
    const again = applyEvent(state, { type: 'CLOSE', at: at(11) }, gameplay);
    expect(again).toEqual({ ok: true, state });
  });
});

describe('rejections — what wire input can cause', () => {
  const rejection = (state: Match, event: CompetitionEvent<Board>) => {
    const result = applyEvent(state, event, gameplay);
    return result.ok ? 'applied' : result.rejection;
  };

  it('refuses everything team-side once the match is finished', () => {
    const finished = play(newMatch(), { type: 'CLOSE', at: at(1) });
    expect(rejection(finished,
      { type: 'START_ATTEMPT', at: at(2), difficulty: 'live', board: { moved: 0 } })).toBe('matchFinished');
    expect(rejection(finished, { type: 'CHOOSE_ROLE', at: at(2), roleIndex: 0 })).toBe('matchFinished');
    expect(rejection(finished, teamResolves(0))).toBe('matchFinished');
  });

  it('refuses a second attempt while one is running', () => {
    const running = play(newMatch(), ...startAttempt('live'));
    expect(rejection(running,
      { type: 'START_ATTEMPT', at: at(2), difficulty: 'live', board: { moved: 0 } })).toBe('attemptInProgress');
  });

  it('needs an attempt before a role or a move', () => {
    expect(rejection(newMatch(), { type: 'CHOOSE_ROLE', at: at(1), roleIndex: 0 })).toBe('noAttempt');
    expect(rejection(newMatch(), teamResolves(0))).toBe('noAttempt');
  });

  it('refuses choosing a role twice, and moving before choosing one', () => {
    const chosen = play(newMatch(), ...startAttempt('live'));
    expect(rejection(chosen, { type: 'CHOOSE_ROLE', at: at(2), roleIndex: 1 })).toBe('roleAlreadyChosen');

    const unchosen = play(newMatch(),
      { type: 'START_ATTEMPT', at: at(1), difficulty: 'live', board: { moved: 0 } });
    expect(rejection(unchosen, teamResolves(0))).toBe('notInPlay');
  });

  it("relays the engine's own move rejections", () => {
    const running = play(newMatch(), ...startAttempt('live'),
      { type: 'MOVE', at: at(2), actor: 'team', name: 'pass', args: [] });
    // the bot holds the turn now
    expect(rejection(running, teamResolves(0))).toBe('notYourTurn');

    const fresh = play(newMatch(), ...startAttempt('live'));
    expect(rejection(fresh, { type: 'MOVE', at: at(2), actor: 'team', name: 'nope', args: [] }))
      .toBe('unknownMove');
    expect(rejection(fresh, { type: 'MOVE', at: at(2), actor: 'team', name: 'never', args: [] }))
      .toBe('illegalMove');
  });
});

describe('throws — what only the server itself can cause', () => {
  it('a bot move that cannot apply is a bug, not input', () => {
    const running = play(newMatch(), ...startAttempt('live'),
      { type: 'MOVE', at: at(2), actor: 'team', name: 'pass', args: [] });
    expect(() => applyEvent(running,
      { type: 'MOVE', at: at(2), actor: 'bot', name: 'never', args: [] }, gameplay)).toThrow(/illegal/);
    expect(() => applyEvent(running,
      { type: 'MOVE', at: at(2), actor: 'bot', name: 'nope', args: [] }, gameplay)).toThrow(/unknown/i);
    expect(() => applyEvent(newMatch(),
      { type: 'MOVE', at: at(2), actor: 'bot', name: 'pass', args: [] }, gameplay))
      .toThrow(/outside a running game/);
  });

  it('ADD_MINUTES takes a positive whole number on a live match only', () => {
    for (const minutes of [0, -3, 1.5]) {
      expect(() => applyEvent(newMatch(),
        { type: 'ADD_MINUTES', at: at(1), minutes }, gameplay)).toThrow(/positive integer/);
    }
    const finished = play(newMatch(), { type: 'CLOSE', at: at(1) });
    expect(() => applyEvent(finished,
      { type: 'ADD_MINUTES', at: at(2), minutes: 5 }, gameplay)).toThrow(/finished/);
  });
});

describe('serialization', () => {
  it('the whole state survives a JSON round-trip, mid-game included', () => {
    const state = play(newMatch(), ...startAttempt('live'),
      { type: 'MOVE', at: at(2), actor: 'team', name: 'pass', args: [] });
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });
});
