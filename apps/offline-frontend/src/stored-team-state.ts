import { LOCAL_STORAGE_TEAMSTATE, TeamModelDto, MatchStatus, FinishedMatchStatus, isPageState } from "common-frontend";

// The one place the stored team state is parsed (#367): every read goes through
// this validation instead of trusting JSON.parse's `any`. Anything that does
// not match TeamModelDto — missing, corrupt, or hand-edited — reads as null,
// the same as no stored state at all.

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

// JSON.stringify turned the Date fields into ISO strings on write; reading
// revives them, so the returned value really is the TeamModelDto it claims.
function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string') {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const isCount = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 0;

/// The home page's relay summary as `toHome` saved it; anything malformed
/// reads as absent, which the home page shows as no summary.
export function parseRelayProblems(value: unknown): FinishedMatchStatus['relayProblems'] {
  if (!Array.isArray(value) || !value.every(it =>
    isRecord(it) && isCount(it.maxPoints) && isCount(it.points) && isCount(it.tries))) {
    return undefined;
  }
  return value.map(it => ({ maxPoints: it.maxPoints, points: it.points, tries: it.tries }));
}

export function parseLiveGames(value: unknown): FinishedMatchStatus['liveGames'] {
  if (!Array.isArray(value) || !value.every(it => it === 'won' || it === 'lost' || it === 'draw')) {
    return undefined;
  }
  return [...value];
}

/// What `JSON.parse` makes of a stored value, or undefined if it is not JSON.
export function parseStoredJson(stored: string | null): unknown {
  if (stored === null) {
    return undefined;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return undefined;
  }
}

function parseMatchStatus(value: unknown): MatchStatus | null {
  if (!isRecord(value)) {
    return null;
  }
  if (value.state === 'NOT STARTED') {
    return { state: 'NOT STARTED' };
  }
  if (value.state !== 'IN PROGRESS' && value.state !== 'FINISHED') {
    return null;
  }
  const startAt = parseDate(value.startAt);
  const endAt = parseDate(value.endAt);
  if (startAt === null || endAt === null || typeof value.matchID !== 'string') {
    return null;
  }
  if (value.state === 'IN PROGRESS') {
    return { state: 'IN PROGRESS', startAt, endAt, matchID: value.matchID };
  }
  if (typeof value.score !== 'number') {
    return null;
  }
  const finished: FinishedMatchStatus = { state: 'FINISHED', startAt, endAt, matchID: value.matchID, score: value.score };
  const relayProblems = parseRelayProblems(value.relayProblems);
  const liveGames = parseLiveGames(value.liveGames);
  return {
    ...finished,
    ...(relayProblems && { relayProblems }),
    ...(liveGames && { liveGames }),
  };
}

export function readStoredTeamState(): TeamModelDto | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  const stored = localStorage.getItem(LOCAL_STORAGE_TEAMSTATE);
  if (stored === null) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch {
    return null;
  }
  if (!isRecord(parsed)) {
    return null;
  }
  const { teamId, joinCode, teamName, category, credentials, email, pageState } = parsed;
  if (
    typeof teamId !== 'string' || typeof joinCode !== 'string' ||
    typeof teamName !== 'string' || typeof category !== 'string' ||
    typeof credentials !== 'string' || typeof email !== 'string' ||
    !isPageState(pageState)
  ) {
    return null;
  }
  const relayMatch = parseMatchStatus(parsed.relayMatch);
  const strategyMatch = parseMatchStatus(parsed.strategyMatch);
  if (relayMatch === null || strategyMatch === null) {
    return null;
  }
  return {
    teamId,
    joinCode,
    teamName,
    category,
    credentials,
    email,
    pageState,
    relayMatch,
    strategyMatch,
  };
}
