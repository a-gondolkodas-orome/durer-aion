import { LOCAL_STORAGE_TEAMSTATE } from "../api-repository-interface";
import type { ClientRepository } from "../api-repository-interface";
import type { MatchStateDto, TeamModelDto } from "../dto/TeamStateDto";

const LOCAL_STORAGE_GUID = "kjqAEKeFkMpOvOZrzcvp";

export class UserModel {

  constructor(private repo: ClientRepository) {}

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
    console.log("getTeamState guid", guid);
    if (!guid) {
      return null;
    }

    const res = await this.repo.getTeamState(guid);
    console.log("getTeamState res", res);
    return res;
  }

  async adminAll(): Promise<TeamModelDto[] | null> {

    const res = await this.repo.getAll();

    return res;
  }

  async adminMatchState(matchId: String): Promise<MatchStateDto | null> {
    const res = await this.repo.getMatchState(matchId);

    return res;
  }

  async adminGetLogs(matchId: string): Promise<unknown | null> {
    const res = await this.repo.getMatchLogs(matchId);

    return res;
  }

  async resetRealy(teamId: String): Promise<TeamModelDto> {
    return this.repo.resetRelay(teamId);
  }

  async resetStrategy(teamId: String): Promise<TeamModelDto> {
    return this.repo.resetStrategy(teamId);
  }

  async addMinutes(matchId: String, minutes: number): Promise<void> {
    await this.repo.addMinutes(matchId, minutes);
  }

  async startRelay(): Promise<void> {
    const guid = this.getGuid();

    if (!guid) {
      return;
    }
    try {
      await this.repo.startRelay(guid);
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
    try {
      await this.repo.startStrategy(guid);
    }
    catch (e) {
      console.log(e);
      window.location.reload();
    }
  }

  async removeTeam(teamId: string): Promise<void> {
    try {
      await this.repo.removeTeam(teamId);
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
    const guid = await this.repo.joinWithCode(joinCode);
    console.log("login guid", guid);
    this.saveGUID(guid);
    return null;
  }

  async toHome(): Promise<void> {
    const guid = this.getGuid();

    if (!guid) {
      return;
    }

    try {
      await this.repo.toHome(guid);
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
