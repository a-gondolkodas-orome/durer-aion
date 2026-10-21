import { vi } from "vitest";
import { PageState, TeamModelDto } from "../dto/TeamStateDto";

export const mockTeamState: TeamModelDto = {
  teamId: "Long Id",
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

let teamState: TeamModelDto | null = null;

const setPageState = (pageState: PageState) => {
  teamState = { ...mockTeamState, pageState };
};

export const MockTeamState = {
  get teamState() { return teamState; },
  // Module state outlives a test, so a suite resets it before each one.
  mockLoggedOut: () => { teamState = null; },
  mockHome: () => setPageState("HOME"),
  mockDisclaimer: () => setPageState("DISCLAIMER"),
  mockRelay: () => setPageState("RELAY"),
  mockStrategy: () => setPageState("STRATEGY"),
  mockHook: {
    useTeamState: () => teamState,
    useRefreshTeamState: vi.fn(),
    useLogin: vi.fn(),
    useLogout: vi.fn(),
    useStartRelay: vi.fn(),
    useStartStrategy: vi.fn(),
    useToHome: vi.fn(),
    LoadTeamState: () => null,
  },
};
