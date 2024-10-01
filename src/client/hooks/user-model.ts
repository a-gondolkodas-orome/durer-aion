import { LOCAL_STORAGE_TEAMSTATE, OfflineClientRepository, RealClientRepository } from "../api-repository-interface";
import { TeamModelDto } from "../dto/TeamStateDto";

const LOCAL_STORAGE_GUID = "kjqAEKeFkMpOvOZrzcvp";

let ClientRepository = RealClientRepository;
if (process.env.REACT_APP_WHICH_VERSION === "b") {
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
