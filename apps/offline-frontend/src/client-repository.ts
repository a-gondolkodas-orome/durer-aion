import { ClientRepository, LOCAL_STORAGE_TEAMSTATE, TeamModelDto, MatchStateDto } from "common-frontend";
import { teamData } from "./teamData";
import { sendDataLogin, sendGameData } from "./sendData";

export class OfflineClientRepository implements ClientRepository {
  
  version = "OFFLINE" as const;
  
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
    sendGameData("relay", "start");
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
    
  sendGameData("strategy", "start");
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
      sendGameData("relay", "end", undefined, {points: score})
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