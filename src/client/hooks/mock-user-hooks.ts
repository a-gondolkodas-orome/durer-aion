import { TeamModelDto } from "../dto/TeamStateDto";

const mockTeam: TeamModelDto = {
  id: "Long Id",
  joinCode: "111-1111-111",
  teamName: "test team",
  category: "C",
  credentials: "credentials",
  email: "email",
  pageState: "INIT",
  relayMatch: {
    state: "NOT STARTED",
  },
  strategyMatch: {
    state: "NOT STARTED",
  },
}

export class MockTeamState {
  public static teamState: TeamModelDto | null = null;

  public static mockInit = () => {
    this.teamState = {
      ...mockTeam,
      pageState: "INIT",
    };
  };

  public static mockRelay = () => {
    this.teamState = {
      ...mockTeam,
      pageState: "RELAY",
    };
  };

  public static mockStrategy = () => {
    this.teamState = {
      ...mockTeam,
      pageState: "STRATEGY",
    };
  };

  public static mockFinished = () => {
    this.teamState = {
      ...mockTeam,
      pageState: "FINISHED",
    };
  };

  public static mockHook = {
    useTeamState: () => {
      return MockTeamState.teamState;
    },
    useRefreshTeamState: jest.fn(),
    useLogin: jest.fn(),
    useLogout: jest.fn(),
    useStartRelay: jest.fn(),
    useStartStrategy: jest.fn(),
    LoadTeamState: () => {
      return null;
    },
  };
}
