import urlcat from "urlcat";
import axios, { AxiosInstance, AxiosError } from 'axios';
// Type-only on purpose: client-repository.test.ts loads this file without the
// package's dist build, which the CI test job does not produce.
import type { ClientRepository, TeamModelDto, MatchStateDto, BoardMoves } from "common-frontend";

// Always the page's own origin: the session is a cookie, and a cookie does not
// ride a cross-origin request. In dev the Vite server proxies the backend
// (vite.config.ts) the way nginx does in the docker stack.
function apiAxiosInstance(): AxiosInstance {
  return axios.create({
    baseURL: '/',
    timeout: 10000,
  });
}

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
      // here we can set message according to status (or data)
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
      // here we can set message according to status (or data)
      throw new Error('Váratlan hiba történt', { cause: e });
    }
  }

  async logout(): Promise<void> {
    try {
      await apiAxiosInstance().post('team/me/logout');
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
      // here we can set message according to status (or data)
      throw new Error('Váratlan hiba történt', { cause: e });
    }
  }

  async startStrategy(): Promise<void> {
    try {
      await apiAxiosInstance().post('team/me/strategy/play');
    } catch (e: unknown) {
      const err = makeAxiosError(e);
      console.error(err.message)
      // here we can set message according to status (or data)
      throw new Error('Váratlan hiba történt', { cause: e });
    }
  }

  async toHome(): Promise<void> {
    try {
      await apiAxiosInstance().post('team/me/gohome');
    } catch (e: unknown) {
      const err = makeAxiosError(e);
      console.error(err.message)
      // here we can set message according to status (or data)
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
      // here we can set message according to status (or data)
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
      // here we can set message according to status (or data)
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
      // here we can set message according to status (or data)
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
      // here we can set message according to status (or data)
      if (err.code === "501") {
        throw new Error('Lejárt játékot már nem lehet módosítani', { cause: e });
      }
      throw new Error('Váratlan hiba történt', { cause: e });
    }
    return result.data;
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
      // here we can set message according to status (or data)
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
      // here we can set message according to status (or data)
      throw new Error('Váratlan hiba történt', { cause: e });
    }
    return result.data;
  }

  async removeTeam(teamId: string): Promise<void> {
    const url = urlcat('/team/admin/:teamId/remove', {
      teamId: teamId,
    });
    try {
      await apiAxiosInstance().delete(url);
    } catch (e: unknown) {
      const err = makeAxiosError(e);
      console.error(err.message)
      throw e;
    }
  }

  // Scoring and the clock are server-authoritative, so these travel as the
  // moves themselves over the match's socket rather than as separate HTTP
  // calls.
  submitRelayAnswer(answer: number, moves: BoardMoves): Promise<void> {
    moves.submitAnswer(answer);
    return Promise.resolve();
  }

  startRelayGame(moves: BoardMoves): Promise<void> {
    moves.startGame();
    return Promise.resolve();
  }

  syncRelayTime(moves: BoardMoves): Promise<void> {
    moves.getTime();
    return Promise.resolve();
  }
}
