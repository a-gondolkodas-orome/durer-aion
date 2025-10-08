import urlcat from "urlcat";
import axios, { AxiosInstance,AxiosError } from 'axios';
import { ClientRepository, TeamModelDto, MatchStateDto } from "common-frontend";

class ApiAxios {
  static instance(): AxiosInstance {
    let apiUrl = '/'; // TODO: env or something

    return axios.create({
      baseURL: apiUrl,
      timeout: 10000,
    });
  }
}

function makeAxiosError(any_error:any): AxiosError {
  if(!axios.isAxiosError(any_error)){
    throw  any_error;
  }
  const axiosError = any_error as AxiosError<Error>;
  return axiosError;
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
      result = await ApiAxios.instance().get(url);
    } catch (e: any) {
      console.error(e)
      // here we can set message according to status (or data)
      throw new Error('Váratlan hiba történt');
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

  async joinWithCode(
    code: string,
  ): Promise<string> {
    const url = urlcat('team/join/:code', {
      code,
    });
    console.log("joinWithCode url", url);
    let result;
    try {
      result = await ApiAxios.instance().get(url);
    } catch (e: any) {
      const err = makeAxiosError(e);
      if(err.response?.status === 404) {
        throw new Error('Nem létező kód');
      }
      // here we can set message according to status (or data)
      throw new Error('Váratlan hiba történt');
    }
    
    console.log("joinWithCode result", result);

    return result.data as string;
  }

  async startRelay(
    guid: string,
  ): Promise<string> {
    const url = urlcat('/team/:guid/relay/play', {
      guid,
    });
    let result;
    try {
      result = await ApiAxios.instance().get(url);
    } catch (e: any) {
      const err = makeAxiosError(e)
      console.error(err.message)
      // here we can set message according to status (or data)
      throw new Error('Váratlan hiba történt');
    }

    return result.data as string;
  }

  async startStrategy(
    guid: string,
  ): Promise<string> {
    const url = urlcat('/team/:guid/strategy/play', {
      guid,
    });
    let result;
    try {
      result = await ApiAxios.instance().get(url);
    } catch (e: any) {
      const err = makeAxiosError(e);
      console.error(err.message)
      // here we can set message according to status (or data)
      throw new Error('Váratlan hiba történt');
    }

    return result.data as string;
  }

  async toHome(
    guid: string,
  ): Promise<string> {
    const url = urlcat('/team/:guid/goHome', {
      guid,
    });
    let result;
    try {
      result = await ApiAxios.instance().get(url);
    } catch (e: any) {
      const err = makeAxiosError(e);
      console.error(err.message)
      // here we can set message according to status (or data)
      throw new Error('Váratlan hiba történt');
    }

    return result.data as string;
  }

  async getAll(): Promise<TeamModelDto[]> {
    const url = urlcat('/team/admin/all', {
    });
    let result;
    try {
      result = await ApiAxios.instance().get(url);
    } catch (e: any) {
      const err = makeAxiosError(e);
      console.error(err.message)
      // here we can set message according to status (or data)
      throw new Error('Váratlan hiba történt');
    }

    return result.data as TeamModelDto[];
  }

  async resetRelay(teamId: String): Promise<TeamModelDto> {
    const url = urlcat('/team/admin/:teamId/reset/relay', {
      teamId,
    });
    let result;
    try {
      result = await ApiAxios.instance().get(url);
    } catch (e: any) {
      const err = makeAxiosError(e);
      console.error(err.message)
      // here we can set message according to status (or data)
      throw new Error('Váratlan hiba történt');
    }
    return result.data as TeamModelDto;
  }

  async resetStrategy(teamId: String): Promise<TeamModelDto> {
    const url = urlcat('/team/admin/:teamId/reset/strategy', {
      teamId,
    });
    let result;
    try {
      result = await ApiAxios.instance().get(url);
    } catch (e: any) {
      const err = makeAxiosError(e);
      console.error(err.message)
      // here we can set message according to status (or data)
      throw new Error('Váratlan hiba történt');
    }
    return result.data as TeamModelDto;
  }

  async addMinutes(matchId: String, minutes: number): Promise<String> {
    const url = urlcat('/game/admin/:matchId/addminutes/:minutes', {
      matchId,
      minutes,
    });
    let result;
    try {
      result = await ApiAxios.instance().get(url);
    } catch (e: any) {
      const err = makeAxiosError(e);
      console.error(err.message)
      // here we can set message according to status (or data)
      if (err.code === "501") {
        throw new Error('Lejárt játékot már nem lehet módosítani');
      }
      throw new Error('Váratlan hiba történt');
    }
    return result.data;
  }

  async getMatchState(matchId: String): Promise<MatchStateDto> {
    const url = urlcat('/game/admin/:matchId/state', {
      matchId,
    });
    let result;
    try {
      result = await ApiAxios.instance().get(url);
    } catch (e: any) {
      const err = makeAxiosError(e);
      console.error(err.message)
      // here we can set message according to status (or data)
      throw new Error('Váratlan hiba történt');
    }
    return result.data as MatchStateDto;
  }

  async getMatchLogs(matchId: String): Promise<MatchStateDto> {
    const url = urlcat('/game/admin/:matchId/logs', {
      matchId,
    });
    let result;
    try {
      result = await ApiAxios.instance().get(url);
    } catch (e: any) {
      const err = makeAxiosError(e);
      console.error(err.message)
      // here we can set message according to status (or data)
      throw new Error('Váratlan hiba történt');
    }
    return result.data;
  }

}