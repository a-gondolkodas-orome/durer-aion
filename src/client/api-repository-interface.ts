import urlcat from "urlcat";
import axios, { AxiosInstance,AxiosError } from 'axios';
import { TeamModelDto } from "./dto/TeamStateDto";
  
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
}


export class MockClientRepository implements ClientRepository {
  startRelay(code: string): Promise<string> {
    return Promise.resolve("ok");
  }
  startStrategy(code: string): Promise<string> {
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
          pageState: 'FINISHED',
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

const addMin = (from: Date, t: number): Date => {
  return new Date(from.setMinutes(from.getMinutes()+t));
}
