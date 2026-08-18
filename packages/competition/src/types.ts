import type { ClientMoveRejection, CoreState } from 'engine';

export type Difficulty = 'test' | 'live'

// One competition match of one team at one game, as data. Everything is
// JSON-safe (the engine's serialization contract in its types.ts): a server
// persists this as a jsonb column and replays it from the event log.
export type CompetitionMatchState<TBoard, TTurnState = unknown> = {
  gameId: string
  category: string
  // ISO timestamps. endAt moves when an admin adds minutes; every clock rule
  // reads these rather than any wall clock, which is what keeps applyEvent
  // pure and a replay exact.
  clock: { startAt: string; endAt: string }
  // tries counts live attempts only, exactly as the old wrapper's
  // numberOfTries did; test games never touch the tally.
  tally: { tries: number; losses: number; streak: number; points: number }
  // The attempt being played, or the finished one still on display — a new
  // START_ATTEMPT replaces it. null before the first attempt.
  attempt: {
    difficulty: Difficulty
    // the team's seat; null until CHOOSE_ROLE
    roleIndex: number | null
    // position in the game's curated list, when the board came from one;
    // null for a generated (test) board. The board itself lives in core.
    startBoardIndex: number | null
    core: CoreState<TBoard, TTurnState>
  } | null
  finished: boolean
}

// Every event carries `at`, the server time it was accepted — the clock rules
// read it, and the log stays self-contained for replay. Whatever is
// non-deterministic (the board handed out, the moves a bot chose) rides in
// the event, never inside applyEvent.
export type CompetitionEvent<TBoard> =
  | {
    type: 'START_ATTEMPT'
    at: string
    difficulty: Difficulty
    board: TBoard
    startBoardIndex?: number
  }
  | { type: 'CHOOSE_ROLE'; at: string; roleIndex: number }
  // A team MOVE is one client move — its auto endOfTurnMove plays inside the
  // same event, exactly as applyClientMove plays it. A bot MOVE is one move
  // of the turn playBotTurn named, autos included as their own events —
  // exactly the list playBotTurn returned. Each event replays through the
  // same path it was accepted through, which is what makes the log a fold.
  | { type: 'MOVE'; at: string; actor: 'team' | 'bot'; name: string; args: unknown[] }
  | { type: 'ADD_MINUTES'; at: string; minutes: number }
  | { type: 'CLOSE'; at: string }

// Team-attributable refusals, in the engine's loudness-follows-attribution
// sense: these arrive over the wire and get a reason a route can map to a
// response. Everything only the server's own code can cause throws instead.
export type CompetitionRejection =
  | ClientMoveRejection
  | 'matchFinished'
  | 'attemptInProgress'
  | 'noAttempt'
  | 'roleAlreadyChosen'

export type ApplyEventResult<TBoard, TTurnState = unknown> =
  | { ok: true; state: CompetitionMatchState<TBoard, TTurnState> }
  // No state on a rejection, for the reason applyClientMove gives none:
  // nothing changed, and handing back a state invites applying it.
  | { ok: false; rejection: CompetitionRejection }
