import { applyClientMove, createInitialCoreState, reduceMove, unknownMoveMessage } from 'engine';
import type { Gameplay } from 'engine';
import type { ApplyEventResult, CompetitionEvent, CompetitionMatchState } from './types';

export const LENGTH_OF_COMPETITION_MINUTES = 30;

// The scoring ladder, ported from gamewrapper.ts and the per-game copies so it
// lives once: a second consecutive live win scores by how many live games were
// lost before it, flooring at 2.
const POINTS_BY_PRIOR_LOSSES = [12, 9, 6, 4, 3, 2];
export const pointsForSecondWin = (priorLosses: number): number =>
  POINTS_BY_PRIOR_LOSSES[Math.min(priorLosses, POINTS_BY_PRIOR_LOSSES.length - 1)]!;

// A move submitted this long after the clock ran out still lands; the match
// closes right after it either way. Ported from the old wrapper's
// turn.onMove; unit-tested here rather than buried in transport.
const LATE_MOVE_GRACE_MS = 10 * 1000;

// The engine's core names seats '0'/'1' only for presentation; headless there
// is nobody to name.
const PLAYER_NAMES: [string, string] = ['0', '1'];

const minutesAfter = (at: string, minutes: number): string =>
  new Date(new Date(at).getTime() + minutes * 60 * 1000).toISOString();

export const createCompetitionMatchState = <TBoard, TTurnState = unknown>({
  gameId, category, startAt, minutes = LENGTH_OF_COMPETITION_MINUTES
}: {
  gameId: string
  category: string
  startAt: string
  minutes?: number
}): CompetitionMatchState<TBoard, TTurnState> => ({
  gameId,
  category,
  clock: { startAt, endAt: minutesAfter(startAt, minutes) },
  tally: { tries: 0, losses: 0, streak: 0, points: 0 },
  attempt: null,
  finished: false
});

type Attempt<TBoard, TTurnState> =
  NonNullable<CompetitionMatchState<TBoard, TTurnState>['attempt']>

// The old wrapper let a game end without deciding the competition: the team
// returns to start a new attempt. Only a live game moves the tally, and only
// the second consecutive win finishes the match with points.
const withGameEndScored = <TBoard, TTurnState>(
  state: CompetitionMatchState<TBoard, TTurnState>,
  attempt: Attempt<TBoard, TTurnState>
): CompetitionMatchState<TBoard, TTurnState> => {
  const next = { ...state, attempt };
  if (attempt.core.phase !== 'gameEnd' || attempt.difficulty !== 'live') return next;
  if (attempt.core.winnerIndex === attempt.roleIndex) {
    const streak = state.tally.streak + 1;
    if (streak >= 2) {
      return {
        ...next,
        tally: { ...state.tally, streak, points: pointsForSecondWin(state.tally.losses) },
        finished: true
      };
    }
    return { ...next, tally: { ...state.tally, streak } };
  }
  return { ...next, tally: { ...state.tally, streak: 0, losses: state.tally.losses + 1 } };
};

// Applies one event to one match, purely: same state and event, same result,
// which is what lets the event log replay into the exact persisted state.
//
// Loudness follows attribution, as in the engine: what a team's wire input can
// cause is a typed rejection; what only the server's own code can cause — a
// bot naming a bad move, an admin event that cannot apply — throws.
export const applyEvent = <TBoard, TTurnState = unknown>(
  state: CompetitionMatchState<TBoard, TTurnState>,
  event: CompetitionEvent<TBoard>,
  gameplay: Gameplay<TBoard, TTurnState>
): ApplyEventResult<TBoard, TTurnState> => {
  switch (event.type) {
    case 'START_ATTEMPT': {
      if (state.finished) return { ok: false, rejection: 'matchFinished' };
      if (state.attempt && state.attempt.core.phase !== 'gameEnd') {
        return { ok: false, rejection: 'attemptInProgress' };
      }
      return {
        ok: true,
        state: {
          ...state,
          // exactly the old chooseNewGameType: only a live attempt is a try
          tally: event.difficulty === 'live'
            ? { ...state.tally, tries: state.tally.tries + 1 }
            : state.tally,
          attempt: {
            difficulty: event.difficulty,
            roleIndex: null,
            startBoardIndex: event.startBoardIndex ?? null,
            core: createInitialCoreState<TBoard, TTurnState>(event.board)
          }
        }
      };
    }

    case 'CHOOSE_ROLE': {
      if (state.finished) return { ok: false, rejection: 'matchFinished' };
      if (!state.attempt) return { ok: false, rejection: 'noAttempt' };
      if (state.attempt.core.phase !== 'roleSelection') {
        return { ok: false, rejection: 'roleAlreadyChosen' };
      }
      return {
        ok: true,
        state: {
          ...state,
          attempt: {
            ...state.attempt,
            roleIndex: event.roleIndex,
            core: {
              ...state.attempt.core,
              phase: 'play',
              currentPlayer: 0,
              chosenRoleIndex: event.roleIndex
            }
          }
        }
      };
    }

    case 'MOVE': {
      const { attempt } = state;
      if (event.actor === 'team') {
        if (state.finished) return { ok: false, rejection: 'matchFinished' };
        if (!attempt) return { ok: false, rejection: 'noAttempt' };
        const result = applyClientMove(
          attempt.core, gameplay, event.name, event.args, { asPlayer: attempt.roleIndex ?? undefined }
        );
        if (!result.ok) return { ok: false, rejection: result.rejection };
        const scored = withGameEndScored(state, { ...attempt, core: result.state });
        // The old wrapper's grace ran *after* the move landed (turn.onMove),
        // so a late move still counts — its win included — and the match
        // closes right behind it.
        const lateBeyondGrace =
          new Date(event.at).getTime() > new Date(state.clock.endAt).getTime() + LATE_MOVE_GRACE_MS;
        return { ok: true, state: lateBeyondGrace ? { ...scored, finished: true } : scored };
      }

      // The bot is the server's own code: everything below is a bug to throw
      // on, never wire input to refuse.
      if (state.finished) throw new Error('applyEvent: bot move on a finished match');
      if (!attempt || attempt.core.phase !== 'play') {
        throw new Error('applyEvent: bot move outside a running game');
      }
      if (!gameplay.moves[event.name]) throw new Error(unknownMoveMessage(event.name, gameplay.moves));
      const transition = reduceMove(
        attempt.core, gameplay.moves[event.name]!, event.name, event.args, PLAYER_NAMES
      );
      if (transition.illegal) {
        throw new Error(`applyEvent: illegal bot move ${event.name}(${JSON.stringify(event.args)}) `
          + `on board ${JSON.stringify(attempt.core.board)}`);
      }
      const scored = withGameEndScored(state, { ...attempt, core: transition.state });
      // The old judge rule (turn.onEnd): once the clock has run out, the
      // bot's move is the match's last — no grace on this side.
      const pastEnd = new Date(event.at).getTime() >= new Date(state.clock.endAt).getTime();
      return { ok: true, state: pastEnd ? { ...scored, finished: true } : scored };
    }

    case 'ADD_MINUTES': {
      if (!Number.isInteger(event.minutes) || event.minutes <= 0) {
        throw new Error(`applyEvent: ADD_MINUTES needs a positive integer, got ${event.minutes}`);
      }
      if (state.finished) throw new Error('applyEvent: ADD_MINUTES on a finished match');
      return {
        ok: true,
        state: { ...state, clock: { ...state.clock, endAt: minutesAfter(state.clock.endAt, event.minutes) } }
      };
    }

    case 'CLOSE':
      // Idempotent on purpose: an admin close racing a stale-match close is a
      // benign double, not a bug.
      return { ok: true, state: state.finished ? state : { ...state, finished: true } };
  }
};
