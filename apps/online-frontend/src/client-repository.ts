import urlcat from "urlcat";
import axios, { AxiosInstance } from 'axios';
import { I18nError, apiRefusal } from "common-frontend/core";
import type { AdminClientRepository, ClientRepository, MatchStatus, TeamModelDto, MatchStateDto, TeamImportResultDto, CompetitionSummaryDto, BundleImportResultDto } from "common-frontend";
import type { Tracker } from "./tracking";

// Always the page's own origin: the session is a cookie, and a cookie does not
// ride a cross-origin request. In dev the Vite server proxies the backend
// (vite.config.ts) the way nginx does in the docker stack.
function apiAxiosInstance(timeoutMs = 10000): AxiosInstance {
  return axios.create({
    baseURL: '/',
    timeout: timeoutMs,
  });
}

// An import writes its rows one by one, so a competition's thousand teams can
// take longer than the default allows. Giving up early does not stop the
// server, and the answer it drops is the only copy of the join codes the
// import generated, so this outlasts nginx's own 60-second
// `proxy_read_timeout`: past that the codes are lost either way.
const IMPORT_TIMEOUT_MS = 90_000;

/**
 * Sends a request and answers its data, or throws an `I18nError` saying why it
 * failed: the server's code when it refused, otherwise what the browser saw.
 * A failure with no code is an unexpected error to the user, and its details
 * go to the console.
 */
async function request<T>(
  send: (api: AxiosInstance) => Promise<{ data: T }>,
  { timeoutMs, timedOutKey = 'error.timedOut' }: { timeoutMs?: number, timedOutKey?: string } = {},
): Promise<T> {
  try {
    return (await send(apiAxiosInstance(timeoutMs))).data;
  } catch (e: unknown) {
    if (!axios.isAxiosError(e)) {
      throw e;
    }
    const refusal = apiRefusal(e.response?.data, e);
    if (refusal) {
      throw refusal;
    }
    // t('error.fileTooLarge'), t('error.timedOut'), t('error.noConnection')
    if (e.response?.status === 413) {
      throw new I18nError('error.fileTooLarge', { cause: e });
    }
    if (e.code === 'ECONNABORTED') {
      throw new I18nError(timedOutKey, { cause: e });
    }
    if (e.response === undefined) {
      throw new I18nError('error.noConnection', { cause: e });
    }
    console.error(e.message, e.response.data);
    throw new I18nError('error.unexpected', { cause: e });
  }
}

// The times travel as ISO strings; the pages read Dates.
function withDates(match: MatchStatus): MatchStatus {
  return match.state === 'NOT STARTED' ? match : { ...match, startAt: new Date(match.startAt), endAt: new Date(match.endAt) };
}

/** The team routes: the session cookie says which team, so nothing here
 * carries the team's id (issue #89). */
export class RealClientRepository implements ClientRepository, AdminClientRepository {

  version = "ONLINE" as const;

  constructor(private tracker?: Tracker) {}

  async getTeamState(): Promise<TeamModelDto | null> {
    let data;
    try {
      data = await request(api => api.get<TeamModelDto & { serverTime?: string }>('team/me'));
    } catch (e: unknown) {
      // No session — a browser that never logged in, or whose cookie expired.
      if (e instanceof I18nError && e.code === 'NOT_LOGGED_IN') {
        return null;
      }
      throw e;
    }

    const state: TeamModelDto = {
      ...data,
      relayMatch: withDates(data.relayMatch),
      strategyMatch: withDates(data.strategyMatch),
    };
    // Taken on arrival, not when a page reads it: the state can be held for
    // hours, and the browser's clock is what the offset corrects.
    if (typeof data.serverTime === 'string') {
      state.clockOffsetMs = Date.parse(data.serverTime) - Date.now();
    }
    this.tracker?.observe(state);
    return state;
  }

  // The code goes in the body, never in the URL: it is the team's login secret.
  async joinWithCode(code: string): Promise<void> {
    await request(api => api.post('team/join', { code }));
    this.tracker?.login();
  }

  async logout(): Promise<void> {
    // The empty body is what makes it JSON, which the server requires.
    await request(api => api.post('team/me/logout', {}));
  }

  async startRelay(): Promise<void> {
    await request(api => api.post('team/me/relay/play'));
    this.tracker?.started('relay');
  }

  async startStrategy(): Promise<void> {
    await request(api => api.post('team/me/strategy/play'));
    this.tracker?.started('strategy');
  }

  async viewStrategy(): Promise<void> {
    await request(api => api.post('team/me/strategy/view'));
  }

  async toHome(): Promise<void> {
    await request(api => api.post('team/me/gohome'));
  }

  async getAll(): Promise<TeamModelDto[]> {
    return await request(api => api.get<TeamModelDto[]>('/team/admin/all'));
  }

  async resetRelay(teamId: string): Promise<TeamModelDto> {
    const url = urlcat('/team/admin/:teamId/reset/relay', { teamId });
    return await request(api => api.post<TeamModelDto>(url));
  }

  async resetStrategy(teamId: string): Promise<TeamModelDto> {
    const url = urlcat('/team/admin/:teamId/reset/strategy', { teamId });
    return await request(api => api.post<TeamModelDto>(url));
  }

  async setStartWindow(teamId: string, window: { opensAt: string | null, closesAt: string | null }): Promise<TeamModelDto> {
    const url = urlcat('/team/admin/:teamId/start-window', { teamId });
    return await request(api => api.put<TeamModelDto>(url, window));
  }

  async addMinutes(matchId: string, minutes: number): Promise<string> {
    const url = urlcat('/game/admin/:matchId/addminutes/:minutes', { matchId, minutes });
    return await request(api => api.post<string>(url));
  }

  async getCompetitions(): Promise<CompetitionSummaryDto[]> {
    return await request(api => api.get<CompetitionSummaryDto[]>('/team/admin/competitions'));
  }

  async setCompetitionWindow(competitionId: string, window: { opensAt: string | null, closesAt: string | null }): Promise<void> {
    const url = urlcat('/team/admin/competitions/:competitionId/start-window', { competitionId });
    await request(api => api.put(url, window));
  }

  async importTeams(file: File): Promise<TeamImportResultDto> {
    const body = new FormData();
    body.append('file', file);
    // Giving up does not stop the server, so some teams may be in.
    // t('error.importTimedOut')
    return await request(api => api.put<TeamImportResultDto>('/team/admin/import', body),
      { timeoutMs: IMPORT_TIMEOUT_MS, timedOutKey: 'error.importTimedOut' });
  }

  async importCompetitions(bundle: unknown): Promise<BundleImportResultDto> {
    return await request(api => api.post<BundleImportResultDto>('/team/admin/competitions/import', bundle));
  }

  async exportCompetitions(): Promise<unknown> {
    return await request(api => api.get<unknown>('/team/admin/competitions/export'));
  }

  async getMatchState(matchId: string): Promise<MatchStateDto> {
    const url = urlcat('/game/admin/:matchId/state', { matchId });
    return await request(api => api.get<MatchStateDto>(url));
  }

  async getMatchLogs(matchId: string): Promise<MatchStateDto> {
    const url = urlcat('/game/admin/:matchId/logs', { matchId });
    return await request(api => api.get<MatchStateDto>(url));
  }
}
