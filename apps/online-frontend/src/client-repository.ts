import urlcat from "urlcat";
import axios, { AxiosInstance, AxiosError } from 'axios';
import i18n from "i18next";
// Type-only on purpose: client-repository.test.ts loads this file without the
// package's dist build, which the CI test job does not produce.
import type { ClientRepository, TeamModelDto, MatchStateDto, ImportResultDto } from "common-frontend";

// Always the page's own origin: the session is a cookie, and a cookie does not
// ride a cross-origin request. In dev the Vite server proxies the backend
// (vite.config.ts) the way nginx does in the docker stack.
function apiAxiosInstance(timeoutMs = 10000): AxiosInstance {
  return axios.create({
    baseURL: '/',
    timeout: timeoutMs,
  });
}

// A team import is one request that loads the whole file in one transaction,
// so it is one wait rather than many — but a wait long enough that the default
// would cut it. Set above nginx's `proxy_read_timeout` (nginx.conf) rather than
// under it, so the browser is never the first to give up: timing out here does
// not stop the server, and the response it drops carries the join codes the
// import just generated, which nothing else keeps together — the admin page
// shows a join code one team at a time, in that team's dialog, so a whole
// file's worth would have to be copied out by hand. Past the proxy's own
// ceiling they are lost either way; this only makes sure the whole of that
// ceiling is usable.
const IMPORT_TIMEOUT_MS = 180000;

function makeAxiosError(any_error: unknown): AxiosError {
  if (!axios.isAxiosError(any_error)) {
    throw  any_error;
  }
  const axiosError = any_error as AxiosError<Error>;
  return axiosError;
}

/** The team routes: the session cookie says which team, so nothing here
 * carries the team's id (issue #89). */
export class RealClientRepository implements ClientRepository {

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

  /** The TSV is the body: it is what the route takes, and it is the only shape
   * a paste into the admin page can have. */
  async importTeams(tsv: string, options?: { dryRun?: boolean }): Promise<ImportResultDto> {
    const url = urlcat('/team/admin/import', options?.dryRun === true ? { dryRun: 1 } : {});
    try {
      const result = await apiAxiosInstance(IMPORT_TIMEOUT_MS).put(url, tsv, {
        headers: { 'Content-Type': 'text/tab-separated-values' },
      });
      return result.data as ImportResultDto;
    } catch (e: unknown) {
      const err = makeAxiosError(e);
      console.error(err.message)
      if (err.response?.status === 413) {
        throw new Error('A fájl túl nagy.', { cause: e });
      }
      if (err.code === 'ECONNABORTED') {
        // The request may still be running: the server was not told to stop.
        throw new Error('Az importálás túl sokáig tartott. Frissíts, és nézd meg, bekerültek-e a csapatok.', { cause: e });
      }
      // The one server fault the route names: it could not generate a free id
      // or join code. Worded here rather than shown from the body, the way the
      // 413 above is — the wire is English, for the logs and the CLI, and the
      // organiser reading this page is owed Hungarian.
      if (err.response?.status === 503) {
        throw new Error('A szerver nem tudott szabad azonosítót vagy belépőkódot generálni, ezért semmit sem importált. '
          + 'Ez a szerver hibája, nem a fájlé.', { cause: e });
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
