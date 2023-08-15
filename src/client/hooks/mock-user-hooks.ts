import { TeamModelDto } from "../dto/TeamStateDto";

export const mockTeamState: TeamModelDto = {
  id: "Long Id",
  joinCode: "111-1111-111",
  teamName: "test team",
  category: "C",
  credentials: "credentials",
  email: "email",
  pageState: "HOME",
  relayMatch: {
    state: "NOT STARTED",
  },
  strategyMatch: {
    state: "NOT STARTED",
  },
}

export class MockTeamState {
  public static teamState: TeamModelDto | null = null;

  public static mockHome = () => {
    this.teamState = {
      ...mockTeamState,
      pageState: "HOME",
    };
  };

  public static mockDisclaimer = () => {
    this.teamState = {
      ...mockTeamState,
      pageState: "DISCLAIMER",
    };
  };

  public static mockRelay = () => {
    this.teamState = {
      ...mockTeamState,
      pageState: "RELAY",
    };
  };

  public static mockStrategy = () => {
    this.teamState = {
      ...mockTeamState,
      pageState: "STRATEGY",
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
    useToHome: jest.fn(),
    LoadTeamState: () => {
      return null;
    },
  };
}
