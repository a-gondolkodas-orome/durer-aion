
import { MatchStateDto, TeamModelDto } from "./dto/TeamStateDto";
import { createContext, useContext } from 'react';

export const LOCAL_STORAGE_TEAMSTATE = "aegnjrlearnjla";

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
  getVersion(): Promise<string>
  getAll(): Promise<TeamModelDto[]>
  getMatchState(matchId: String): Promise<MatchStateDto>
  getMatchLogs(matchId: String): Promise<MatchStateDto>
  resetRelay(teamId: String): Promise<TeamModelDto>
  resetStrategy(teamId: String): Promise<TeamModelDto>
  addMinutes(matchId: String, minutes: number): Promise<String>
}


export class MockClientRepository implements ClientRepository {
  getVersion(): Promise<string> {
    return Promise.resolve("MOCK");
  }
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
  getAll(): Promise<TeamModelDto[]> {
    return Promise.resolve([]);
  }
  getMatchState(matchId: String): Promise<MatchStateDto> {
    throw Error("NOT call this");
  }
  getMatchLogs(matchId: String): Promise<MatchStateDto> {
    throw Error("NOT call this");
  }
  resetRelay(teamId: String): Promise<TeamModelDto> {
    throw Error("NOT call this");
  }
  resetStrategy(teamId: String): Promise<TeamModelDto> {
    throw Error("NOT call this");
  }
  addMinutes(matchId: String, minutes: number): Promise<String> {
    return Promise.resolve("OK");
  }
}

export const ClientRepoContext = createContext<ClientRepository | null>(null);
export const ClientRepoProvider = ClientRepoContext.Provider;
export const useClientRepo = (): ClientRepository => {
  const repo = useContext(ClientRepoContext);
  if (!repo) throw new Error('ClientRepoContext not provided');
  return repo;
};

const addMin = (from: Date, t: number): Date => {
  return new Date(from.setMinutes(from.getMinutes()+t));
}
