import { TeamModelDto } from "../dto/TeamStateDto";

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

const setPageState = (pageState: 'DISCLAIMER'|'HOME'|'RELAY'|'STRATEGY') => {  
  teamState = { ...mockTeamState, pageState };  
};  

export const MockTeamState = {  
  get teamState() { return teamState; },  
  mockHome: () => setPageState("HOME"),  
  mockDisclaimer: () => setPageState("DISCLAIMER"),  
  mockRelay: () => setPageState("RELAY"),  
  mockStrategy: () => setPageState("STRATEGY"),  
  mockHook: {  
    useTeamState: () => teamState,  
    useRefreshTeamState: jest.fn(),  
    useLogin: jest.fn(),  
    useLogout: jest.fn(),  
    useStartRelay: jest.fn(),  
    useStartStrategy: jest.fn(),  
    useToHome: jest.fn(),  
    LoadTeamState: () => null,  
  },  
};
