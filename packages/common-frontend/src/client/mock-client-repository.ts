import type { BoardMoves, ClientRepository, TeamEdit } from "./api-repository-interface";
import type { MatchStateDto, TeamModelDto } from "./dto/TeamStateDto";

// Tests only: the package entry does not export this, so it stays out of the
// build the apps bundle.

const inAMinute = (): Date => new Date(Date.now() + 60_000);

// What `GET /team/me` answers, keyed by join code: no `teamId`, `joinCode` or
// `email`, which only the admin routes serve.
const teamsByJoinCode: Record<string, () => TeamModelDto> = {
  // A team in the middle of a relay match.
  "2": () => ({
    teamName: "TEAM 2",
    category: "C",
    credentials: "credentials",
    pageState: "RELAY",
    relayMatch: {
      state: "IN PROGRESS",
      startAt: new Date(),
      endAt: inAMinute(),
      matchID: "1",
    },
    strategyMatch: {
      state: "NOT STARTED",
    },
  }),
};

export class MockClientRepository implements ClientRepository {
  version = "MOCK" as const;
  // The join code last logged in with.
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
    return Promise.resolve(this.session === null ? null : teamsByJoinCode[this.session]());
  }
  joinWithCode(code: string): Promise<void> {
    if (!(code in teamsByJoinCode)) {
      throw new Error("BAD CODE");
    }
    this.session = code;
    return Promise.resolve();
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
  editTeam(_teamId: string, _edit: TeamEdit): Promise<TeamModelDto> {
    throw Error("NOT call this");
  }
  addMinutes(_matchId: string, _minutes: number): Promise<string> {
    return Promise.resolve("OK");
  }
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
}
