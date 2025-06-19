import urlcat from "urlcat";
import axios, { AxiosInstance,AxiosError } from 'axios';
import { MatchStateDto, TeamModelDto } from "./dto/TeamStateDto";
import { teamData } from "../teamData";
import { sendDataLogin, sendDataRelayEnd, sendDataRelayStart, sendDataStrategyStart } from "../common/sendData";

export const LOCAL_STORAGE_TEAMSTATE = "aegnjrlearnjla";

class ApiAxios {
  static instance(): AxiosInstance {
    let apiUrl = '/'; // TODO: env or something

    return axios.create({
      baseURL: apiUrl,
      timeout: 10000,
    });
  }
}

export interface ClientRepository {
  getTeamState(
    guid: string,
  ): Promise<TeamModelDto>;
  joinWithCode(
    code: string,
  ): Promise<string>
  startRelay(
    code: string,
  ): Promise<string>
  startStrategy(
    code: string,
  ): Promise<string>
  toHome(
    code: string,
  ): Promise<string>
  removeTeam(
    teamId: string,
  ): Promise<{ removed: boolean; teamId: string }>;
}

function makeAxiosError(any_error:any): AxiosError {
  if(!axios.isAxiosError(any_error)){
    throw  any_error;
  }
  const axiosError = any_error as AxiosError<Error>;
  return axiosError;
}

export class RealClientRepository implements ClientRepository {
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

  async removeTeam(teamId: string): Promise<{ removed: boolean; teamId: string }> {
    const url = urlcat('/team/admin/:teamId/remove', { teamId });
    let result;
    try {
      result = await ApiAxios.instance().delete(url);
    } catch (e: any) {
      const err = makeAxiosError(e);
      if (err.response?.status === 404) {
        throw new Error('A csapat nem található');
      }
      throw new Error('Váratlan hiba történt');
    }
    return result.data;
  }
}


export class MockClientRepository implements ClientRepository {
  startRelay(code: string): Promise<string> {
    return Promise.resolve("ok");
  }
  startStrategy(code: string): Promise<string> {
    return Promise.resolve("ok");
  }
  toHome(code: string): Promise<string> {
    return Promise.resolve("ok");
  }
  getTeamState(guid: string): Promise<TeamModelDto> {
    if (guid === "1") {
      return Promise.resolve(
        {
          teamId: "1",
          joinCode: "1",
          teamName: "TEAM 1",
          category: "C kat",
          credentials: "asjdgaskjd",
          email: "team1@mail.hu",
          pageState: 'HOME',
          relayMatch: {
            state: 'NOT STARTED',
          },
          strategyMatch: {
            state: 'NOT STARTED',
          },
        }
      )
    }
    if (guid === "2") {
      return Promise.resolve(
        {
          teamId: "1",
          joinCode: "1",
          teamName: "TEAM 1",
          category: "C",
          credentials: "asjdgaskjd",
          email: "team1@mail.hu",
          pageState: 'RELAY',
          relayMatch: {
            state: 'IN PROGRESS',
            startAt: new Date(),
            endAt: addMin(new Date(), 1),
            matchID: "1",
          },
          strategyMatch: {
            state: 'NOT STARTED',
          },
        }
      )
    }
    if (guid === "3") {
      return Promise.resolve(
        {
          teamId: "1",
          joinCode: "1",
          teamName: "TEAM 1",
          category: "C kat",
          credentials: "asjdgaskjd",
          email: "team1@mail.hu",
          pageState: 'HOME',
          relayMatch: {
            state: 'NOT STARTED',
          },
          strategyMatch: {
            state: 'NOT STARTED',
          },
          other: "",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      )
    }
    if (guid === "4") {
      return Promise.resolve(
        {
          teamId: "1",
          joinCode: "1",
          teamName: "TEAM 1",
          category: "C kat",
          credentials: "asjdgaskjd",
          email: "team1@mail.hu",
          pageState: 'RELAY',
          relayMatch: {
            state: 'FINISHED',
            startAt: new Date(),
            endAt: new Date(),
            matchID: "2",
            score: 76,
          },
          strategyMatch: {
            state: 'NOT STARTED',
          },
          other: "",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      )
    }
    if (guid === "5") {
      return Promise.resolve(
        {
          teamId: "1",
          joinCode: "1",
          teamName: "TEAM 1",
          category: "C kat",
          credentials: "asjdgaskjd",
          email: "team1@mail.hu",
          pageState: 'STRATEGY',
          relayMatch: {
            state: 'NOT STARTED',
          },
          strategyMatch: {
            state: 'IN PROGRESS',
            startAt: new Date(),
            endAt: addMin(new Date(), 30),
            matchID: "3",
          },
          other: "",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      )
    }
    if (guid === "6") {
      return Promise.resolve(
        {
          teamId: "1",
          joinCode: "1",
          teamName: "TEAM 1",
          category: "C kat",
          credentials: "asjdgaskjd",
          email: "team1@mail.hu",
          pageState: 'STRATEGY',
          relayMatch: {
            state: 'NOT STARTED',
          },
          strategyMatch: {
            state: 'FINISHED',
            startAt: new Date(),
            endAt: new Date(),
            matchID: "5",
            score: 32,
          },
          other: "",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      )
    }
    if (guid === "7") {
      return Promise.resolve(
        {
          teamId: "1",
          joinCode: "1",
          teamName: "TEAM 1",
          category: "C kat",
          credentials: "asjdgaskjd",
          email: "team1@mail.hu",
          pageState: 'HOME',
          relayMatch: {
            state: 'FINISHED',
            startAt: new Date(),
            endAt: new Date(),
            matchID: "6",
            score: 32,
          },
          strategyMatch: {
            state: 'FINISHED',
            startAt: new Date(),
            endAt: new Date(),
            matchID: "7",
            score: 32,
          },
          other: "",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      )
    }
    throw new Error("BAD GUID");
  }
  joinWithCode(code: string): Promise<string> {
    if (+code < 8 && +code > 0) {
      return Promise.resolve(code)
    }
    throw new Error("BAD CODE");
  }

  removeTeam(teamId: string): Promise<{ removed: boolean; teamId: string }> {
    return Promise.resolve({ removed: true, teamId });
  }
}

export class OfflineClientRepository implements ClientRepository {
  startRelay(joinCode: string): Promise<string> {
    const teamState = getTeamStateFromLocal();
    if (!(teamState.pageState === 'HOME' && teamState.relayMatch.state === 'NOT STARTED' && teamState.strategyMatch.state !== 'IN PROGRESS')) {
      throw new Error('Váratlan hiba történt');
    }
    const newState = {
      ...teamState,
      pageState: 'RELAY',
      relayMatch: {
        state: 'IN PROGRESS',
        startAt: new Date(),
        endAt: addMin(new Date(), 60),
        matchID: "",
      },
    }
    sendDataRelayStart(newState as TeamModelDto);
    localStorage.setItem(LOCAL_STORAGE_TEAMSTATE,
      JSON.stringify(newState)
    );
    return Promise.resolve("ok");
  }

  startStrategy(joinCode: string): Promise<string> {
    const teamState = getTeamStateFromLocal();
    if (!(teamState.pageState === 'HOME' && teamState.strategyMatch.state === 'NOT STARTED' && teamState.relayMatch.state !== 'IN PROGRESS')) {
      throw new Error('Váratlan hiba történt');
    }
    const newState = {
      ...teamState,
      pageState: 'STRATEGY',
      strategyMatch: {
        state: 'IN PROGRESS',
        startAt: new Date(),
        endAt: addMin(new Date(), 30),
        matchID: "",
      },
    }
    sendDataStrategyStart(newState as TeamModelDto); // TODO remove "as"
    localStorage.setItem(LOCAL_STORAGE_TEAMSTATE,
      JSON.stringify(newState)
    );
    return Promise.resolve("ok");
  }

  toHome(joinCode: string): Promise<string> {
    const teamState = getTeamStateFromLocal();
    const newState = {...teamState, pageState: 'HOME'}
    if (teamState.relayMatch.state === "IN PROGRESS"){
      const score = Number(localStorage.getItem("RelayPoints"))
      sendDataRelayEnd(null, {points: score}, null)
      newState.relayMatch = {
        ...teamState.relayMatch,
        state: "FINISHED",
        endAt: new Date(),
        score: score,
      }
    }
    if (teamState.strategyMatch.state === "IN PROGRESS"){
      newState.strategyMatch = {
        ...teamState.strategyMatch,
        state: "FINISHED",
        endAt: new Date(),
        score: Number(localStorage.getItem("StrategyPoints")),
      }
    }
    localStorage.setItem(LOCAL_STORAGE_TEAMSTATE, JSON.stringify(newState));
    return Promise.resolve("ok");
  }

  getTeamState(joinCode: string): Promise<TeamModelDto> {
    const teamState = getTeamStateFromLocal();
    return Promise.resolve(teamState) as Promise<TeamModelDto>;
  }

  async getAll(): Promise<any> {
    return null;
  }

  async resetRelay(teamId: String): Promise<TeamModelDto> {
    throw Error("NOT call this");
  }

  async resetStrategy(teamId: String): Promise<TeamModelDto> {
    throw Error("NOT call this");
  }

  async addMinutes(matchId: String, minutes: number): Promise<String> {
    return Promise.resolve("OK");
  }

  async getMatchState(matchId: String): Promise<MatchStateDto> {
    throw Error("NOT call this");
  }
  async getMatchLogs(matchId: String): Promise<MatchStateDto> {
    throw Error("NOT call this");
  }

  joinWithCode(joinCode: string): Promise<string> {
    // return the  if it is in the teamData.ts file

    const i = teamData.findIndex(e => e.join_code === joinCode);
    let pageState = "DISCLAIMER"
    if (typeof localStorage !== "undefined") {
      const teamStateString = localStorage.getItem(LOCAL_STORAGE_TEAMSTATE);
      if (teamStateString !== null){
        const teamState = JSON.parse(teamStateString);
        pageState = teamState.pageState;
      }
    }

    if (i > -1) {
      const i = teamData.findIndex(e => e.join_code === joinCode);
      const currentTeamData = teamData[i];
      const teamState = {
        teamId: "1",
        joinCode: joinCode,
        teamName: currentTeamData.teamname,
        category: currentTeamData.category,
        credentials: "credentials",
        email: "asd@asd.asd",
        pageState: pageState,
        relayMatch: {
          state: 'NOT STARTED',
        },
        strategyMatch: {
          state: 'NOT STARTED',
        },
      }

      sendDataLogin(teamState as TeamModelDto); // TODO: remove as TeamModelDto
      localStorage.setItem(LOCAL_STORAGE_TEAMSTATE,
        JSON.stringify(teamState)
      );
      return Promise.resolve(joinCode);
    }

    throw new Error("Rossz belépési kód!");
  }

  removeTeam(teamId: string): Promise<{ removed: boolean; teamId: string }> {
    return Promise.resolve({ removed: true, teamId });
  }
}


const getTeamStateFromLocal = (): TeamModelDto => {
  if (typeof localStorage === "undefined") {
    throw new Error('Váratlan hiba történt');
  }
  const teamstateString = localStorage.getItem(LOCAL_STORAGE_TEAMSTATE);
  if (teamstateString === null) {
    throw new Error('Váratlan hiba történt');
  }
  return JSON.parse(teamstateString);
}

const addMin = (from: Date, t: number): Date => {
  return new Date(from.setMinutes(from.getMinutes()+t));
}
