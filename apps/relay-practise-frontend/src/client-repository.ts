import { ClientRepository, teamStateStorageKey, TeamModelDto, MatchStateDto, BoardMoves } from "common-frontend";
import { teamData } from "./teamData";
import { sendDataLogin, sendGameData } from "./sendData";
import { readStoredTeamState } from "./stored-team-state";
import i18n from "i18next";

export class OfflineClientRepository implements ClientRepository {
  
  version = "OFFLINE" as const;
  
  startRelay(_joinCode: string): Promise<string> {
    const teamState = getTeamStateFromLocal();
    if (!(teamState.pageState === 'HOME' && teamState.relayMatch.state === 'NOT STARTED' && teamState.strategyMatch.state !== 'IN PROGRESS')) {
      throw new Error(i18n.t('error.unexpected'));
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
    sendGameData({component: "relay", phase: "start"});
    localStorage.setItem(teamStateStorageKey(),
      JSON.stringify(newState)
    );
    return Promise.resolve("ok");
  }

  // Relay-only app: nothing renders a strategy game, so nothing may call this.
  startStrategy(_joinCode: string): Promise<string> {
    throw Error("NOT call this");
  }

  toHome(_joinCode: string): Promise<string> {
    const teamState = getTeamStateFromLocal();
    const newState = {...teamState, pageState: 'HOME'}
    if (teamState.relayMatch.state === "IN PROGRESS"){
      const score = Number(localStorage.getItem("RelayPoints"))
      sendGameData({component: "relay", phase: "end", G: {points: score}})
      newState.relayMatch = {
        ...teamState.relayMatch,
        state: "FINISHED",
        endAt: new Date(),
        score: score,
      }
    }
    localStorage.setItem(teamStateStorageKey(), JSON.stringify(newState));
    return Promise.resolve("ok");
  }

  getTeamState(_joinCode: string): Promise<TeamModelDto> {
    const teamState = getTeamStateFromLocal();
    return Promise.resolve(teamState);
  }

  async getAll(): Promise<TeamModelDto[]> {
    return [];
  }

  async resetRelay(_teamId: string): Promise<TeamModelDto> {
    throw Error("NOT call this");
  }

  async resetStrategy(_teamId: string): Promise<TeamModelDto> {
    throw Error("NOT call this");
  }

  async addMinutes(_matchId: string, _minutes: number): Promise<string> {
    return Promise.resolve("OK");
  }

  async getMatchState(_matchId: string): Promise<MatchStateDto> {
    throw Error("NOT call this");
  }
  async getMatchLogs(_matchId: string): Promise<MatchStateDto> {
    throw Error("NOT call this");
  }
  async removeTeam(_teamId: string): Promise<void> {
    throw Error("NOT call this");
  }

  // The local boardgame.io client judges the answer with the bundled bot, and
  // its step report already goes out through RelayWrapper's sendGameData hook,
  // so nothing is sent from here.
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

  joinWithCode(joinCode: string): Promise<string> {
    // return the joincode if it is in the teamData.ts file

    const i = teamData.findIndex(e => e.join_code === joinCode);

    if (i > -1) {
      const currentTeamData = teamData[i];
      // There is no disclaimer/home page in this app: logging in to a test
      // always starts from HOME so that startRelay() can run right away.
      const pageState = "HOME";
      const teamState: TeamModelDto = {
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

      sendDataLogin(teamState);
      localStorage.setItem(teamStateStorageKey(),
        JSON.stringify(teamState)
      );
      return Promise.resolve(joinCode);
    }

    throw new Error(i18n.t('login.error.wrongid'));
  }

}


const getTeamStateFromLocal = (): TeamModelDto => {
  const teamState = readStoredTeamState();
  if (teamState === null) {
    throw new Error(i18n.t('error.unexpected'));
  }
  return teamState;
}

const addMin = (from: Date, t: number): Date => {
  return new Date(from.setMinutes(from.getMinutes()+t));
}