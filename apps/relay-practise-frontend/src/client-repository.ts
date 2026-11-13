import { ClientRepository, relayPointsStorageKey, teamStateStorageKey, TeamModelDto } from "common-frontend/core";
import { findPracticeSet } from "./practice-sets";
import type { RelayEndReport } from "game";
import { handleGameReport } from "./game-report";
import { readStoredTeamState } from "./stored-team-state";
import { trackRelayStarted } from "./tracking";
import i18n from "i18next";

export class OfflineClientRepository implements ClientRepository {

  version = "OFFLINE" as const;

  startRelay(): Promise<void> {
    const teamState = getTeamStateFromLocal();
    if (!(teamState.pageState === 'HOME' && teamState.relayMatch.state === 'NOT STARTED' && teamState.strategyMatch.state !== 'IN PROGRESS')) {
      throw new Error(i18n.t('error.unexpected'));
    }
    const practiceSet = findPracticeSet(teamState.teamName);
    if (practiceSet === undefined) {
      throw new Error(i18n.t('error.unexpected'));
    }
    const newState = {
      ...teamState,
      pageState: 'RELAY',
      relayMatch: {
        state: 'IN PROGRESS',
        startAt: new Date(),
        endAt: addMin(new Date(), practiceSet.relay.durationMinutes),
        matchID: "",
      },
    }
    trackRelayStarted(teamState.teamName);
    // An earlier round's, which handleGameReport would take for this round's
    // finish.
    localStorage.removeItem(relayPointsStorageKey());
    localStorage.setItem(teamStateStorageKey(),
      JSON.stringify(newState)
    );
    return Promise.resolve();
  }

  // Relay-only app: nothing renders a strategy game, so nothing may call this.
  startStrategy(): Promise<void> {
    throw Error("NOT call this");
  }

  viewStrategy(): Promise<void> {
    throw Error("NOT call this");
  }

  toHome(): Promise<void> {
    const teamState = getTeamStateFromLocal();
    const newState = { ...teamState, pageState: 'HOME' }
    if (teamState.relayMatch.state === "IN PROGRESS") {
      const score = Number(localStorage.getItem(relayPointsStorageKey()))
      newState.relayMatch = {
        ...teamState.relayMatch,
        state: "FINISHED",
        endAt: new Date(),
        score: score,
      }
    }
    localStorage.setItem(teamStateStorageKey(), JSON.stringify(newState));
    return Promise.resolve();
  }

  // The stored team state is the session here: UserModel.logout removes it.
  getTeamState(): Promise<TeamModelDto | null> {
    return Promise.resolve(readStoredTeamState());
  }

  logout(): Promise<void> {
    return Promise.resolve();
  }

  // Persisted as if the game had reported it, for toHome() to read.
  keepRelayEnd(report: RelayEndReport): void {
    handleGameReport(report);
  }

  // The code is the id of the practice set the selector picked.
  joinWithCode(joinCode: string): Promise<void> {
    const practiceSet = findPracticeSet(joinCode);

    if (practiceSet !== undefined) {
      const { metadata } = practiceSet;
      // There is no disclaimer/home page in this app: logging in to a test
      // always starts from HOME so that startRelay() can run right away.
      const pageState = "HOME";
      const teamState: TeamModelDto = {
        teamId: "1",
        joinCode: joinCode,
        teamName: joinCode,
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

      localStorage.setItem(teamStateStorageKey(),
        JSON.stringify(teamState)
      );
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
