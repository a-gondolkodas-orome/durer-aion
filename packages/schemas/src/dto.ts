import {
  FinishedMatchStatus,
  InProgressMatchStatus,
  MatchStatus,
  NotStartedMatchStatus,
} from './model';

// Decision (#367): these response DTOs are validated at runtime, not
// types-only. The HTTP boundary is the one place the compiler cannot see
// across — the backend serializes its own model, the client reads fields — so
// a backend/frontend shape drift surfaces in this parser or not at all. The
// parser is strict about the fields the client relies on, ignores whatever
// else the wire carries (`other`, the timestamps), and revives the Date
// fields JSON flattened to strings, so the returned value really has the
// declared type. Anything that does not match parses as null; the caller
// decides how loudly to fail.

export type PageState = 'DISCLAIMER' | 'HOME' | 'RELAY' | 'STRATEGY';

export interface TeamModelDto {
  teamId: string;
  joinCode: string;
  teamName: string;
  category: string;
  credentials: string;
  email: string;
  pageState: PageState;
  relayMatch: MatchStatus;
  strategyMatch: MatchStatus;
}

const PAGE_STATES: readonly string[] = [
  'DISCLAIMER',
  'HOME',
  'RELAY',
  'STRATEGY',
] satisfies PageState[];

function isPageState(value: unknown): value is PageState {
  return typeof value === 'string' && PAGE_STATES.includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string') {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseMatchStatus(value: unknown): MatchStatus | null {
  if (!isRecord(value)) {
    return null;
  }
  if (value.state === 'NOT STARTED') {
    const status: NotStartedMatchStatus = { state: 'NOT STARTED' };
    return status;
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
    const status: InProgressMatchStatus = { state: 'IN PROGRESS', startAt, endAt, matchID: value.matchID };
    return status;
  }
  if (typeof value.score !== 'number') {
    return null;
  }
  const status: FinishedMatchStatus = { state: 'FINISHED', startAt, endAt, matchID: value.matchID, score: value.score };
  return status;
}

export function parseTeamModelDto(value: unknown): TeamModelDto | null {
  if (!isRecord(value)) {
    return null;
  }
  const { teamId, joinCode, teamName, category, credentials, email, pageState } = value;
  if (
    typeof teamId !== 'string' || typeof joinCode !== 'string' ||
    typeof teamName !== 'string' || typeof category !== 'string' ||
    typeof credentials !== 'string' || typeof email !== 'string' ||
    !isPageState(pageState)
  ) {
    return null;
  }
  const relayMatch = parseMatchStatus(value.relayMatch);
  const strategyMatch = parseMatchStatus(value.strategyMatch);
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
