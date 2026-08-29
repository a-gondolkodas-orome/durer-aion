import type { ClientRepository } from "../api-repository-interface";
import type { MatchStateDto, TeamModelDto } from "../dto/TeamStateDto";
import { bgioStoragePrefix, guidStorageKey, relayPointsStorageKey, strategyPointsStorageKey, teamStateStorageKey } from "../utils/storage-keys";

function removeGameStateLocalStorage() {
  // Collect first, remove after: removeItem inside a key(idx) loop shifts the
  // remaining keys down, so every key right after a removed one is skipped.
  const keys = [...Array(localStorage.length).keys()]
    .map(idx => localStorage.key(idx))
    .filter((key): key is string => key !== null && key.startsWith(bgioStoragePrefix()));
  keys.forEach(key => localStorage.removeItem(key));
}

export class UserModel {

  constructor(private repo: ClientRepository) {}

  private async saveGUID(guid: string) {
    localStorage.setItem(guidStorageKey(), guid);
  }

  getGuid(): string | null {
    if (typeof localStorage === "undefined") {
      return null;
    }

    const guid = localStorage.getItem(guidStorageKey());

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

  async adminMatchState(matchId: string): Promise<MatchStateDto | null> {
    const res = await this.repo.getMatchState(matchId);

    return res;
  }

  async adminGetLogs(matchId: string): Promise<unknown | null> {
    const res = await this.repo.getMatchLogs(matchId);

    return res;
  }

  async resetRealy(teamId: string): Promise<TeamModelDto> {
    return this.repo.resetRelay(teamId);
  }

  async resetStrategy(teamId: string): Promise<TeamModelDto> {
    return this.repo.resetStrategy(teamId);
  }

  async addMinutes(matchId: string, minutes: number): Promise<void> {
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
    await this.repo.removeTeam(teamId);
  }

  isUserLoggedIn(): boolean {
    const guid = this.getGuid();

    if (!guid) {
      return false;
    }

    return true;
  }

  logout() {
    localStorage.removeItem(guidStorageKey());
    localStorage.removeItem(teamStateStorageKey());
    localStorage.removeItem(relayPointsStorageKey());
    localStorage.removeItem(strategyPointsStorageKey());
    removeGameStateLocalStorage();
  }

  async login(joinCode: string): Promise<string | null> {
    const guid = await this.repo.joinWithCode(joinCode);
    console.log("login guid", guid);
    await this.saveGUID(guid);
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
      const onGuidChanged = async (event: StorageEvent) => {
        if (event.key !== guidStorageKey()) {
          return;
        }

        const value = await this.getTeamState();

        if (previousValue !== value) {
          setTeamState(value);
          previousValue = value;
        }
      };
      window.addEventListener("storage", (event) => {
        void onGuidChanged(event);
      });
    }
  }
}
