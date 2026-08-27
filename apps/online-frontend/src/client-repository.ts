import urlcat from "urlcat";
import axios, { AxiosInstance,AxiosError } from 'axios';
import { ClientRepository, TeamModelDto, MatchStateDto, parseTeamModelDto, parseMatchStateDto } from "common-frontend";

const serverUrl = import.meta.env.VITE_SERVER_URL || '/';
function apiAxiosInstance(): AxiosInstance {
  return axios.create({
    baseURL: serverUrl,
    timeout: 10000,
  });
}

function makeAxiosError(any_error: unknown): AxiosError {
  if(!axios.isAxiosError(any_error)){
    throw  any_error;
  }
  const axiosError = any_error as AxiosError<Error>;
  return axiosError;
}

// A response that fails its parser is thrown as the same generic error a
// transport failure already gets; the console keeps the evidence.
function parseOrThrow<T>(url: string, data: unknown, parse: (value: unknown) => T | null): T {
  const parsed = parse(data);
  if (parsed === null) {
    console.error(`unexpected response shape from ${url}`, data);
    throw new Error('Váratlan hiba történt');
  }
  return parsed;
}

export class RealClientRepository implements ClientRepository {

  version = "ONLINE" as const;

  async getTeamState(
    guid: string,
  ): Promise<TeamModelDto> {
    const url = urlcat('team/:guid', {
      guid,
    });
    let result;
    try {
      result = await apiAxiosInstance().get<unknown>(url);
    } catch (e: unknown) {
      console.error(e)
      // here we can set message according to status (or data)
      throw new Error('Váratlan hiba történt');
    }

    return parseOrThrow(url, result.data, parseTeamModelDto);
  }

  async joinWithCode(
    code: string,
  ): Promise<string> {
    const url = urlcat('team/join/:code', {
      code,
    });
    console.log("joinWithCode url", url);
    let result;
    try {
      result = await apiAxiosInstance().get<unknown>(url);
    } catch (e: unknown) {
      const err = makeAxiosError(e);
      if(err.response?.status === 404) {
        throw new Error('Nem létező kód');
      }
      // here we can set message according to status (or data)
      throw new Error('Váratlan hiba történt');
    }

    console.log("joinWithCode result", result);

    if (typeof result.data !== 'string') {
      console.error(`unexpected response shape from ${url}`, result.data);
      throw new Error('Váratlan hiba történt');
    }
    return result.data;
  }

  async startRelay(
    guid: string,
  ): Promise<void> {
    const url = urlcat('/team/:guid/relay/play', {
      guid,
    });
    try {
      await apiAxiosInstance().get(url);
    } catch (e: unknown) {
      const err = makeAxiosError(e)
      console.error(err.message)
      // here we can set message according to status (or data)
      throw new Error('Váratlan hiba történt');
    }
  }

  async startStrategy(
    guid: string,
  ): Promise<void> {
    const url = urlcat('/team/:guid/strategy/play', {
      guid,
    });
    try {
      await apiAxiosInstance().get(url);
    } catch (e: unknown) {
      const err = makeAxiosError(e);
      console.error(err.message)
      // here we can set message according to status (or data)
      throw new Error('Váratlan hiba történt');
    }
  }

  async toHome(
    guid: string,
  ): Promise<void> {
    const url = urlcat('/team/:guid/goHome', {
      guid,
    });
    try {
      await apiAxiosInstance().get(url);
    } catch (e: unknown) {
      const err = makeAxiosError(e);
      console.error(err.message)
      // here we can set message according to status (or data)
      throw new Error('Váratlan hiba történt');
    }
  }

  async getAll(): Promise<TeamModelDto[]> {
    const url = urlcat('/team/admin/all', {
    });
    let result;
    try {
      result = await apiAxiosInstance().get<unknown>(url);
    } catch (e: unknown) {
      const err = makeAxiosError(e);
      console.error(err.message)
      // here we can set message according to status (or data)
      throw new Error('Váratlan hiba történt');
    }

    if (!Array.isArray(result.data)) {
      console.error(`unexpected response shape from ${url}`, result.data);
      throw new Error('Váratlan hiba történt');
    }
    return result.data.map(team => parseOrThrow(url, team, parseTeamModelDto));
  }

  async resetRelay(teamId: string): Promise<TeamModelDto> {
    const url = urlcat('/team/admin/:teamId/reset/relay', {
      teamId,
    });
    let result;
    try {
      result = await apiAxiosInstance().post<unknown>(url);
    } catch (e: unknown) {
      const err = makeAxiosError(e);
      console.error(err.message)
      // here we can set message according to status (or data)
      throw new Error('Váratlan hiba történt');
    }
    return parseOrThrow(url, result.data, parseTeamModelDto);
  }

  async resetStrategy(teamId: string): Promise<TeamModelDto> {
    const url = urlcat('/team/admin/:teamId/reset/strategy', {
      teamId,
    });
    let result;
    try {
      result = await apiAxiosInstance().post<unknown>(url);
    } catch (e: unknown) {
      const err = makeAxiosError(e);
      console.error(err.message)
      // here we can set message according to status (or data)
      throw new Error('Váratlan hiba történt');
    }
    return parseOrThrow(url, result.data, parseTeamModelDto);
  }

  async addMinutes(matchId: string, minutes: number): Promise<void> {
    const url = urlcat('/game/admin/:matchId/addminutes/:minutes', {
      matchId,
      minutes,
    });
    try {
      await apiAxiosInstance().post(url);
    } catch (e: unknown) {
      const err = makeAxiosError(e);
      console.error(err.message)
      // here we can set message according to status (or data)
      if (err.code === "501") {
        throw new Error('Lejárt játékot már nem lehet módosítani');
      }
      throw new Error('Váratlan hiba történt');
    }
  }

  async getMatchState(matchId: string): Promise<MatchStateDto> {
    const url = urlcat('/game/admin/:matchId/state', {
      matchId,
    });
    let result;
    try {
      result = await apiAxiosInstance().get<unknown>(url);
    } catch (e: unknown) {
      const err = makeAxiosError(e);
      console.error(err.message)
      // here we can set message according to status (or data)
      throw new Error('Váratlan hiba történt');
    }
    return parseOrThrow(url, result.data, parseMatchStateDto);
  }

  async getMatchLogs(matchId: string): Promise<unknown> {
    const url = urlcat('/game/admin/:matchId/logs', {
      matchId,
    });
    let result;
    try {
      result = await apiAxiosInstance().get<unknown>(url);
    } catch (e: unknown) {
      const err = makeAxiosError(e);
      console.error(err.message)
      // here we can set message according to status (or data)
      throw new Error('Váratlan hiba történt');
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
}
