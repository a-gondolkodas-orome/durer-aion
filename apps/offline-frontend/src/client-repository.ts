import { ClientRepository, LOCAL_STORAGE_TEAMSTATE, TeamModelDto, clearStoredSession, lastActiveStorageKey, relayPointsStorageKey, strategyPointsStorageKey } from "common-frontend/core";
import { teamData } from "./teamData";
import { dryRunCompetition } from "./rehearsed-round";
import type { RelayEndReport } from "game";
import { sendDataLogin, sendGameData } from "./sendData";
import { handleGameReport } from "./game-report";
import { readStoredStrategyResults, readStoredRelayResults, readStoredTeamState } from "./stored-team-state";
import i18n from "i18next";

export const STORED_LOGIN_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export class OfflineClientRepository implements ClientRepository {

  version = "OFFLINE" as const;

  startRelay(): Promise<void> {
    const teamState = getTeamStateFromLocal();
    const relay = teamState.competition?.relay;
    if (!(relay !== undefined && teamState.pageState === 'HOME' && teamState.relayMatch.state === 'NOT STARTED' && teamState.strategyMatch.state !== 'IN PROGRESS')) {
      throw new Error(i18n.t('error.unexpected'));
    }
    const newState = {
      ...teamState,
      pageState: 'RELAY',
      relayMatch: {
        state: 'IN PROGRESS',
        startAt: new Date(),
        endAt: addMin(new Date(), relay.durationMinutes),
        matchID: "",
      },
    }
    sendGameData({ component: "relay", phase: "start" });
    localStorage.setItem(LOCAL_STORAGE_TEAMSTATE,
      JSON.stringify(newState)
    );
    return Promise.resolve();
  }

  startStrategy(): Promise<void> {
    const teamState = getTeamStateFromLocal();
    const strategy = teamState.competition?.strategy;
    if (!(strategy !== undefined && teamState.pageState === 'HOME' && teamState.strategyMatch.state === 'NOT STARTED' && teamState.relayMatch.state !== 'IN PROGRESS')) {
      throw new Error(i18n.t('error.unexpected'));
    }
    const newState = {
      ...teamState,
      pageState: 'STRATEGY',
      strategyMatch: {
        state: 'IN PROGRESS',
        startAt: new Date(),
        endAt: addMin(new Date(), strategy.durationMinutes),
        matchID: "",
      },
    }

  sendGameData({ component: "strategy", phase: "start" });
    localStorage.setItem(LOCAL_STORAGE_TEAMSTATE,
      JSON.stringify(newState)
    );
    return Promise.resolve();
  }

  // The persisted match is still in localStorage, so the board reopens as it ended.
  viewStrategy(): Promise<void> {
    const teamState = getTeamStateFromLocal();
    if (!(teamState.pageState === 'HOME' && teamState.strategyMatch.state === 'FINISHED' && teamState.relayMatch.state !== 'IN PROGRESS')) {
      throw new Error(i18n.t('error.unexpected'));
    }
    localStorage.setItem(LOCAL_STORAGE_TEAMSTATE, JSON.stringify({ ...teamState, pageState: 'STRATEGY' }));
    return Promise.resolve();
  }

  toHome(): Promise<void> {
    const teamState = getTeamStateFromLocal();
    const newState = { ...teamState, pageState: 'HOME' }
    if (teamState.relayMatch.state === "IN PROGRESS") {
      const score = Number(localStorage.getItem(relayPointsStorageKey()))
      sendGameData({ component: "relay", phase: "end", G: { points: score } })
      newState.relayMatch = {
        ...teamState.relayMatch,
        state: "FINISHED",
        endAt: new Date(),
        score: score,
        relayResults: readStoredRelayResults(),
      }
    }
    if (teamState.strategyMatch.state === "IN PROGRESS") {
      newState.strategyMatch = {
        ...teamState.strategyMatch,
        state: "FINISHED",
        endAt: new Date(),
        score: Number(localStorage.getItem(strategyPointsStorageKey())),
        strategyResults: readStoredStrategyResults(),
      }
    }
    localStorage.setItem(LOCAL_STORAGE_TEAMSTATE, JSON.stringify(newState));
    return Promise.resolve();
  }

  // The stored team state is the session here: UserModel.logout removes it,
  // and so does a day without the app finding the team logged in — the live
  // site's cookie lifetime (team_session.ts), for the same reason: a team that
  // leaves a shared computer without logging out must not stay logged in for
  // the next person. A login stored without the time, by a version before
  // the limit, starts its day now.
  getTeamState(): Promise<TeamModelDto | null> {
    const now = Date.now();
    const lastActive = Number(localStorage.getItem(lastActiveStorageKey()));
    if (lastActive > 0 && now - lastActive > STORED_LOGIN_MAX_AGE_MS) {
      clearStoredSession();
      return Promise.resolve(null);
    }
    const teamState = readStoredTeamState();
    if (teamState !== null) {
      localStorage.setItem(lastActiveStorageKey(), String(now));
    }
    return Promise.resolve(teamState);
  }

  logout(): Promise<void> {
    return Promise.resolve();
  }

  // Persisted as if the game had reported it, for toHome() to read.
  keepRelayEnd(report: RelayEndReport): void {
    handleGameReport(report);
  }

  joinWithCode(joinCode: string): Promise<void> {
    const i = teamData.findIndex(e => e.join_code === joinCode);
    const pageState = readStoredTeamState()?.pageState ?? "DISCLAIMER";

    // teamData.test.ts holds every test team's competition to the round.
    const competition = i > -1 ? dryRunCompetition(teamData[i].competitionId) : undefined;
    if (competition !== undefined) {
      const { metadata } = competition;
      const teamState: TeamModelDto = {
        teamId: "1",
        joinCode: joinCode,
        teamName: teamData[i].teamname,
        competition,
        category: metadata.kind === 'competition' ? metadata.category : '',
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
      localStorage.setItem(LOCAL_STORAGE_TEAMSTATE,
        JSON.stringify(teamState)
      );
      localStorage.setItem(lastActiveStorageKey(), String(Date.now()));
      return Promise.resolve();
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
  return new Date(from.setMinutes(from.getMinutes() + t));
}
