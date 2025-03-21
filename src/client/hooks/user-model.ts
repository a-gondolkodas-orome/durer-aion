import { LOCAL_STORAGE_TEAMSTATE, OfflineClientRepository, RealClientRepository } from "../api-repository-interface";
import { MatchStateDto, TeamModelDto } from "../dto/TeamStateDto";
import { isOfflineMode } from "../utils/appMode";

const LOCAL_STORAGE_GUID = "kjqAEKeFkMpOvOZrzcvp";

let ClientRepository = RealClientRepository;
if (isOfflineMode()) {
  ClientRepository = OfflineClientRepository;
}

export class UserModel {
  private async saveGUID(guid: string) {
    localStorage.setItem(LOCAL_STORAGE_GUID, guid);
  }

  getGuid(): string | null {
    if (typeof localStorage === "undefined") {
      return null;
    }

    const guid = localStorage.getItem(LOCAL_STORAGE_GUID);

    if (!guid) {
      return null;
    }

    return guid;
  }

  async getTeamState(): Promise<TeamModelDto | null> {
    const guid = this.getGuid();

    if (!guid) {
      return null;
    }

    const repo = new ClientRepository();

    const res = await repo.getTeamState(guid);

    return res;
  }

  async adminAll(): Promise<TeamModelDto[] | null> {
    const repo = new ClientRepository();

    const res = await repo.getAll();

    return res;
  }

  async adminMatchState(matchId: String): Promise<MatchStateDto | null> {
    const repo = new ClientRepository();

    const res = await repo.getMatchState(matchId);

    return res;
  }

  async resetRealy(teamId: String): Promise<TeamModelDto> {
    const repo = new ClientRepository();

    return repo.resetRelay(teamId);
  }

  async resetStrategy(teamId: String): Promise<TeamModelDto> {
    const repo = new ClientRepository();

    return repo.resetStrategy(teamId);
  }

  async addMinutes(matchId: String, minutes: number): Promise<void> {
    const repo = new ClientRepository();

    await repo.addMinutes(matchId, minutes);
  }

  async startRelay(): Promise<void> {
    const guid = this.getGuid();

    if (!guid) {
      return;
    }

    const repo = new ClientRepository();
    try {
      await repo.startRelay(guid);
    }
    catch (e) {
      console.log(e);
      window.location.reload();
    }
  }

  async starStrategy(): Promise<void> {
    const guid = this.getGuid();

    if (!guid) {
      return;
    }

    const repo = new ClientRepository();

    try {
      await repo.startStrategy(guid);
    }
    catch (e) {
      console.log(e);
      window.location.reload();
    }
  }

  isUserLoggedIn(): boolean {
    const guid = this.getGuid();

    if (!guid) {
      return false;
    }

    return true;
  }

  logout() {
    localStorage.removeItem(LOCAL_STORAGE_GUID);
    localStorage.removeItem(LOCAL_STORAGE_TEAMSTATE);
    localStorage.removeItem("RelayPoints");
    localStorage.removeItem("StrategyPoints");
    localStorage.removeItem("RelayGamePhase");
    localStorage.removeItem("RelayGameState");
  }

  async login(joinCode: string): Promise<string | null> {
    const repo = new ClientRepository();
    const guid = await repo.joinWithCode(joinCode);
    this.saveGUID(guid);
    return null;
  }

  async toHome(): Promise<void> {
    const guid = this.getGuid();

    if (!guid) {
      return;
    }

    const repo = new ClientRepository();
    try {
      await repo.toHome(guid);
    }
    catch (e) {
      console.log(e);
      window.location.reload();
    }
  }

  private static wasListenerAddedYet = false;

  addListener(setTeamState: (teamState: TeamModelDto | null) => void) {
    if (typeof window !== "undefined" && !UserModel.wasListenerAddedYet) {
      UserModel.wasListenerAddedYet = true;
      let previousValue: TeamModelDto | null = null;
      window.addEventListener("storage", async (event) => {
        if (event?.key !== LOCAL_STORAGE_GUID) {
          return;
        }

        const value = await this.getTeamState();

        if (previousValue !== value) {
          setTeamState(value);
          previousValue = value;
        }
      });
    }
  }
}
