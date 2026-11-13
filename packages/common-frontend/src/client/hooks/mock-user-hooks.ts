import { vi } from "vitest";
import { PageState, TeamModelDto } from "../dto/TeamStateDto";
import type { Language } from "schemas";

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
  /// On the home screen, in a competition held in the given languages.
  mockHomeIn: (languages: Language[]) => {
    teamState = {
      ...mockTeamState,
      pageState: "HOME",
      competition: {
        id: "0000000000--test",
        languages,
        relay: { durationMinutes: 60, problemPoints: [1] },
        metadata: { kind: 'other', label: { hu: 'Teszt', en: 'Test' } },
      },
    };
  },
  mockFinishedStrategy: () => {
    teamState = {
      ...mockTeamState,
      pageState: "STRATEGY",
      strategyMatch: { state: "FINISHED", matchID: "m", score: 0, startAt: new Date(), endAt: new Date() },
    };
  },
  mockHook: {
    useTeamState: () => teamState,
    useRefreshTeamState: vi.fn(),
    useLogin: vi.fn(),
    useLogout: vi.fn(),
    useStartRelay: vi.fn(),
    useStartStrategy: vi.fn(),
    useToHome: vi.fn(),
    useViewStrategy: vi.fn(),
    useBackToHome: vi.fn(),
    LoadTeamState: () => null,
  },
};
