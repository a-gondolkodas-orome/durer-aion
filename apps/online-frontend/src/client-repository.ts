import urlcat from "urlcat";
import axios, { AxiosInstance, AxiosError } from 'axios';
import i18n from "i18next";
// Type-only on purpose: client-repository.test.ts loads this file without the
// package's dist build, which the CI test job does not produce.
import type { AdminClientRepository, ClientRepository, TeamModelDto, MatchStateDto, TeamImportResultDto, CompetitionSummaryDto } from "common-frontend";

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

function makeAxiosError(any_error: unknown): AxiosError {
  if (!axios.isAxiosError(any_error)) {
    throw  any_error;
  }
  const axiosError = any_error as AxiosError<Error>;
  return axiosError;
}

/** The team routes: the session cookie says which team, so nothing here
 * carries the team's id (issue #89). */
export class RealClientRepository implements ClientRepository, AdminClientRepository {

  version = "ONLINE" as const;

  async getTeamState(): Promise<TeamModelDto | null> {
    let result;
    try {
      result = await apiAxiosInstance().get('team/me');
    } catch (e: unknown) {
      const err = makeAxiosError(e);
      // No session — a browser that never logged in, or whose cookie expired.
      if (err.response?.status === 401) {
        return null;
      }
      console.error(err.message)
      throw new Error('Váratlan hiba történt', { cause: e });
    }

    if (result.data.relayMatch.startAt) {
      result.data.relayMatch.startAt = new Date(result.data.relayMatch.startAt);
    }
    if (result.data.relayMatch.endAt) {
      result.data.relayMatch.endAt = new Date(result.data.relayMatch.endAt);
    }
    if (result.data.strategyMatch.startAt) {
      result.data.strategyMatch.startAt = new Date(result.data.strategyMatch.startAt);
    }
    if (result.data.strategyMatch.endAt) {
      result.data.strategyMatch.endAt = new Date(result.data.strategyMatch.endAt);
    }
    // Taken on arrival, not when a page reads it: the state can be held for
    // hours, and the browser's clock is what the offset corrects.
    if (typeof result.data.serverTime === 'string') {
      result.data.clockOffsetMs = Date.parse(result.data.serverTime) - Date.now();
    }
    return result.data as TeamModelDto;
  }

  // The code goes in the body, never in the URL: it is the team's login secret.
  async joinWithCode(
    code: string,
  ): Promise<void> {
    try {
      await apiAxiosInstance().post('team/join', { code });
    } catch (e: unknown) {
      const err = makeAxiosError(e);
      if (err.response?.status === 404) {
        throw new Error('Nem létező kód', { cause: e });
      }
      // The server limits how often a code may be guessed at
      // (apps/online-backend/src/server/rate_limit.ts). Only wrong codes count
      // against it, so a team that sees this has been typing them.
      if (err.response?.status === 429) {
        throw new Error(i18n.t('login.error.tooManyAttempts'), { cause: e });
      }
      throw new Error('Váratlan hiba történt', { cause: e });
    }
  }

  async logout(): Promise<void> {
    try {
      // The empty body is what makes it JSON, which the server requires.
      await apiAxiosInstance().post('team/me/logout', {});
    } catch (e: unknown) {
      const err = makeAxiosError(e);
      console.error(err.message)
      throw new Error('Váratlan hiba történt', { cause: e });
    }
  }

  async startRelay(): Promise<void> {
    try {
      await apiAxiosInstance().post('team/me/relay/play');
    } catch (e: unknown) {
      const err = makeAxiosError(e)
      console.error(err.message)
      throw new Error('Váratlan hiba történt', { cause: e });
    }
  }

  async startStrategy(): Promise<void> {
    try {
      await apiAxiosInstance().post('team/me/strategy/play');
    } catch (e: unknown) {
      const err = makeAxiosError(e);
      console.error(err.message)
      throw new Error('Váratlan hiba történt', { cause: e });
    }
  }

  async viewStrategy(): Promise<void> {
    try {
      await apiAxiosInstance().post('team/me/strategy/view');
    } catch (e: unknown) {
      const err = makeAxiosError(e);
      console.error(err.message)
      throw new Error('Váratlan hiba történt', { cause: e });
    }
  }

  async toHome(): Promise<void> {
    try {
      await apiAxiosInstance().post('team/me/gohome');
    } catch (e: unknown) {
      const err = makeAxiosError(e);
      console.error(err.message)
      throw new Error('Váratlan hiba történt', { cause: e });
    }
  }

  async getAll(): Promise<TeamModelDto[]> {
    const url = urlcat('/team/admin/all', {
    });
    let result;
    try {
      result = await apiAxiosInstance().get(url);
    } catch (e: unknown) {
      const err = makeAxiosError(e);
      console.error(err.message)
      throw new Error('Váratlan hiba történt', { cause: e });
    }

    return result.data as TeamModelDto[];
  }

  async resetRelay(teamId: string): Promise<TeamModelDto> {
    const url = urlcat('/team/admin/:teamId/reset/relay', {
      teamId,
    });
    let result;
    try {
      result = await apiAxiosInstance().post(url);
    } catch (e: unknown) {
      const err = makeAxiosError(e);
      console.error(err.message)
      throw new Error('Váratlan hiba történt', { cause: e });
    }
    return result.data as TeamModelDto;
  }

  async resetStrategy(teamId: string): Promise<TeamModelDto> {
    const url = urlcat('/team/admin/:teamId/reset/strategy', {
      teamId,
    });
    let result;
    try {
      result = await apiAxiosInstance().post(url);
    } catch (e: unknown) {
      const err = makeAxiosError(e);
      console.error(err.message)
      throw new Error('Váratlan hiba történt', { cause: e });
    }
    return result.data as TeamModelDto;
  }

  async addMinutes(matchId: string, minutes: number): Promise<string> {
    const url = urlcat('/game/admin/:matchId/addminutes/:minutes', {
      matchId,
      minutes,
    });
    let result;
    try {
      result = await apiAxiosInstance().post(url);
    } catch (e: unknown) {
      const err = makeAxiosError(e);
      console.error(err.message)
      // The server's 501: the match is finished, or no longer the team's current one.
      if (err.response?.status === 501) {
        throw new Error('Lejárt játékot már nem lehet módosítani', { cause: e });
      }
      throw new Error('Váratlan hiba történt', { cause: e });
    }
    return result.data;
  }

  async getCompetitions(): Promise<CompetitionSummaryDto[]> {
    let result;
    try {
      result = await apiAxiosInstance().get('/team/admin/competitions');
    } catch (e: unknown) {
      const err = makeAxiosError(e);
      console.error(err.message)
      throw new Error('Váratlan hiba történt', { cause: e });
    }
    return result.data as CompetitionSummaryDto[];
  }

  async setCompetitionWindow(competitionId: string, window: { opensAt: string | null, closesAt: string | null }): Promise<void> {
    const url = urlcat('/team/admin/competitions/:competitionId/start-window', { competitionId });
    try {
      await apiAxiosInstance().put(url, window);
    } catch (e: unknown) {
      const err = makeAxiosError(e);
      console.error(err.message)
      throw new Error('Váratlan hiba történt', { cause: e });
    }
  }

  async importTeams(file: File): Promise<TeamImportResultDto> {
    const body = new FormData();
    body.append('file', file);
    try {
      const result = await apiAxiosInstance(IMPORT_TIMEOUT_MS).put('/team/admin/import', body);
      return result.data as TeamImportResultDto;
    } catch (e: unknown) {
      const err = makeAxiosError(e);
      console.error(err.message)
      // The route checks the name the browser sent.
      if (err.response?.status === 400) {
        throw new Error('Csak .tsv kiterjesztésű fájlt lehet importálni.', { cause: e });
      }
      if (err.response?.status === 413) {
        throw new Error('A fájl túl nagy.', { cause: e });
      }
      if (err.code === 'ECONNABORTED') {
        // The server was not told to stop, so some teams may be in.
        throw new Error('Az importálás túl sokáig tartott. Frissíts, és nézd meg, mely csapatok kerültek be, '
          + 'mielőtt újra próbálod.', { cause: e });
      }
      throw new Error('Váratlan hiba történt', { cause: e });
    }
  }

  async getMatchState(matchId: string): Promise<MatchStateDto> {
    const url = urlcat('/game/admin/:matchId/state', {
      matchId,
    });
    let result;
    try {
      result = await apiAxiosInstance().get(url);
    } catch (e: unknown) {
      const err = makeAxiosError(e);
      console.error(err.message)
      throw new Error('Váratlan hiba történt', { cause: e });
    }
    return result.data as MatchStateDto;
  }

  async getMatchLogs(matchId: string): Promise<MatchStateDto> {
    const url = urlcat('/game/admin/:matchId/logs', {
      matchId,
    });
    let result;
    try {
      result = await apiAxiosInstance().get(url);
    } catch (e: unknown) {
      const err = makeAxiosError(e);
      console.error(err.message)
      throw new Error('Váratlan hiba történt', { cause: e });
    }
    return result.data;
  }
}
