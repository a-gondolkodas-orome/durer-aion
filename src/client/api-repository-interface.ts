import urlcat from "urlcat";
import axios, { AxiosInstance,AxiosError } from 'axios';
import { TeamModelDto } from "./dto/TeamStateDto";
import { teamData } from "../teamData";
import { sendDataLogin } from "../common/sendData";

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
      console.log(e)
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
      console.log(err.message)
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
      console.log(err.message)
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
      console.log(err.message)
      // here we can set message according to status (or data)
      throw new Error('Váratlan hiba történt');
    }

    return result.data as string;
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
          id: "1",
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
          id: "1",
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
          id: "1",
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
          id: "1",
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
          id: "1",
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
          id: "1",
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
          id: "1",
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
}

export class OfflineClientRepository implements ClientRepository {
  startRelay(joinCode: string): Promise<string> {
    if (typeof localStorage === "undefined") {
      throw new Error('Váratlan hiba történt');
    }
    const teamstateString = localStorage.getItem(LOCAL_STORAGE_TEAMSTATE);
    if (teamstateString === null) {
      throw new Error('Váratlan hiba történt');
    }
    const teamstate = JSON.parse(teamstateString);
    console.log(teamstate)
    if (!(teamstate.pageState === 'HOME' && teamstate.relayMatch.state === 'NOT STARTED' && teamstate.strategyMatch.state !== 'IN PROGRESS')) {
      throw new Error('Váratlan hiba történt');
    }
    localStorage.setItem(LOCAL_STORAGE_TEAMSTATE,
      JSON.stringify({
        ...teamstate,
        pageState: 'RELAY',
        relayMatch: {
          state: 'IN PROGRESS',
          startAt: new Date(),
          endAt: addMin(new Date(), 60),
          matchID: "",
        },
      })
    );
    return Promise.resolve("ok");
  }

  startStrategy(joinCode: string): Promise<string> {
    if (typeof localStorage === "undefined") {
      throw new Error('Váratlan hiba történt');
    }
    const teamstateString = localStorage.getItem(LOCAL_STORAGE_TEAMSTATE);
    if (teamstateString === null) {
      throw new Error('Váratlan hiba történt');
    }
    const teamstate = JSON.parse(teamstateString);
    if (!(teamstate.pageState === 'HOME' && teamstate.strategyMatch.state === 'NOT STARTED' && teamstate.relayMatch.state !== 'IN PROGRESS')) {
      throw new Error('Váratlan hiba történt');
    }
    localStorage.setItem(LOCAL_STORAGE_TEAMSTATE,
      JSON.stringify({
        ...teamstate,
        pageState: 'STRATEGY',
        strategyMatch: {
          state: 'IN PROGRESS',
          startAt: new Date(),
          endAt: addMin(new Date(), 30),
          matchID: "",
        },
      })
    );
    return Promise.resolve("ok");
  }

  toHome(joinCode: string): Promise<string> {
    if (typeof localStorage === "undefined") {
      throw new Error('Váratlan hiba történt (toHome)');
    }
    const teamstateString = localStorage.getItem(LOCAL_STORAGE_TEAMSTATE);
    if (teamstateString === null) {
      throw new Error('Váratlan hiba történt (toHome)');
    }
    const teamState = JSON.parse(teamstateString);
    const newState = {...teamState, pageState: 'HOME'}
    if (teamState.relayMatch.state === "IN PROGRESS"){
      newState.relayMatch = {
        ...teamState.relayMatch,
        state: "FINISHED",
        endAt: new Date(),
        score: Number(localStorage.getItem("RelayPoints")),
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
    if (typeof localStorage === "undefined") {
      throw new Error('Váratlan hiba történt (getTeamsState)');
    }
    const teamState = localStorage.getItem(LOCAL_STORAGE_TEAMSTATE);
    if (teamState === null) {
      throw new Error('Váratlan hiba történt (getTeamsState)');
    }
    return Promise.resolve(JSON.parse(teamState)) as Promise<TeamModelDto>;
  }

  joinWithCode(joinCode: string): Promise<string> {
    // return the  if it is in the teamData.ts file

    const i = teamData.findIndex(e => e.join_code === joinCode);
    const currentTeamData = teamData[i];
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
        id: "1",
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
}


const addMin = (from: Date, t: number): Date => {
  return new Date(from.setMinutes(from.getMinutes()+t));
}
