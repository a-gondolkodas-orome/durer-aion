import { TeamModelDto } from "../dto/TeamStateDto";

export class MockTeamState {
  public static teamState: TeamModelDto | null = null;

  public static mockInit = () => {
    this.teamState = {
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
