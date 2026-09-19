// cspell:ignore asjdgaskjd

import { DeletedTeamDto, MatchStateDto, RestoreResultDto, TeamModelDto } from "./dto/TeamStateDto";
import { createContext, useContext } from 'react';
import { MatchMoveDispatch } from "./match-moves";
import type { MatchConnection, MatchTimeMoves, RelayMoves } from "./match-moves";

export { LOCAL_STORAGE_TEAMSTATE } from "./utils/storage-keys";

// The session is the repository's to keep, not the caller's: online it is an
// HttpOnly cookie the server set on `joinWithCode` (issue #89), which no script
// can read, so nothing here takes or returns the team's id.
export interface ClientRepository {
  version: "MOCK" | "OFFLINE" | "ONLINE"
  /** The logged-in team, or null when there is no session. */
  getTeamState(): Promise<TeamModelDto | null>;
  joinWithCode(
    code: string,
  ): Promise<void>
  logout(): Promise<void>
  startRelay(): Promise<void>
  startStrategy(): Promise<void>
  toHome(): Promise<void>
  getAll(): Promise<TeamModelDto[]>
  getMatchState(matchId: string): Promise<MatchStateDto>
  getMatchLogs(matchId: string): Promise<MatchStateDto>
  resetRelay(teamId: string): Promise<TeamModelDto>
  resetStrategy(teamId: string): Promise<TeamModelDto>
  addMinutes(matchId: string, minutes: number): Promise<string>
  removeTeam(teamId: string): Promise<void>;
  /** Every team at once, archived as one batch: how many, and the batch's `deletedAt`. */
  removeAllTeams(): Promise<{ deleted: number, deletedAt: string }>;
  getDeleted(): Promise<DeletedTeamDto[]>;
  restoreTeam(deletionId: number): Promise<void>;
  restoreBatch(deletedAt: string): Promise<RestoreResultDto>;
  // The three below are what `MatchMoveDispatch` implements for every build;
  // see that class for why they take the board's moves rather than replacing
  // them, and why only the first two care about the connection.
  submitRelayAnswer(answer: number, moves: RelayMoves, connection: MatchConnection): Promise<void>;
  startRelayGame(moves: RelayMoves, connection: MatchConnection): Promise<void>;
  syncMatchTime(moves: MatchTimeMoves): Promise<void>;

}

export class MockClientRepository extends MatchMoveDispatch implements ClientRepository {
  version = "MOCK" as const;
  // The join code last logged in with; the fixtures below are keyed by it.
  private session: string | null = null;

  private requireSession(): string {
    if (this.session === null) {
      throw new Error("NOT LOGGED IN");
    }
    return this.session;
  }
  startRelay(): Promise<void> {
    this.requireSession();
    return Promise.resolve();
  }
  startStrategy(): Promise<void> {
    this.requireSession();
    return Promise.resolve();
  }
  toHome(): Promise<void> {
    this.requireSession();
    return Promise.resolve();
  }
  logout(): Promise<void> {
    this.session = null;
    return Promise.resolve();
  }
  getTeamState(): Promise<TeamModelDto | null> {
    const guid = this.session;
    if (guid === null) {
      return Promise.resolve(null);
    }
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
  joinWithCode(code: string): Promise<void> {
    if (+code < 8 && +code > 0) {
      this.session = code;
      return Promise.resolve();
    }
    throw new Error("BAD CODE");
  }
  getAll(): Promise<TeamModelDto[]> {
    return Promise.resolve([]);
  }
  getMatchState(_matchId: string): Promise<MatchStateDto> {
    throw Error("NOT call this");
  }
  getMatchLogs(_matchId: string): Promise<MatchStateDto> {
    throw Error("NOT call this");
  }
  resetRelay(_teamId: string): Promise<TeamModelDto> {
    throw Error("NOT call this");
  }
  resetStrategy(_teamId: string): Promise<TeamModelDto> {
    throw Error("NOT call this");
  }
  addMinutes(_matchId: string, _minutes: number): Promise<string> {
    return Promise.resolve("OK");
  }
  removeTeam(_teamId: string): Promise<void> {
    throw Error("NOT call this");
  }
  removeAllTeams(): Promise<{ deleted: number, deletedAt: string }> {
    throw Error("NOT call this");
  }
  getDeleted(): Promise<DeletedTeamDto[]> {
    return Promise.resolve([]);
  }
  restoreTeam(_deletionId: number): Promise<void> {
    throw Error("NOT call this");
  }
  restoreBatch(_deletedAt: string): Promise<RestoreResultDto> {
    throw Error("NOT call this");
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
  return new Date(from.setMinutes(from.getMinutes() + t));
}
