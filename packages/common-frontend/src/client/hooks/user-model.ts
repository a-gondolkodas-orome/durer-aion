import type { ClientRepository } from "../api-repository-interface";
import type { MatchStateDto, TeamModelDto } from "../dto/TeamStateDto";
import { bgioStoragePrefix, legacyGuidStorageKey, loginMarkerStorageKey, relayPointsStorageKey, strategyPointsStorageKey, teamStateStorageKey } from "../utils/storage-keys";

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

  // The session lives with the repository (online: an HttpOnly cookie), so
  // whether a team is logged in is only known by asking.
  async getTeamState(): Promise<TeamModelDto | null> {
    localStorage.removeItem(legacyGuidStorageKey());
    const state = await this.repo.getTeamState();
    if (state === null) {
      // The marker must be gone before the next login writes it: writing the
      // value a key already holds fires no `storage` event, so a marker left
      // over from a session that expired would keep the other tabs from
      // noticing the login.
      localStorage.removeItem(loginMarkerStorageKey());
    }
    return state;
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

  async resetRelay(teamId: string): Promise<TeamModelDto> {
    return this.repo.resetRelay(teamId);
  }

  async resetStrategy(teamId: string): Promise<TeamModelDto> {
    return this.repo.resetStrategy(teamId);
  }

  async addMinutes(matchId: string, minutes: number): Promise<void> {
    await this.repo.addMinutes(matchId, minutes);
  }

  async startRelay(): Promise<void> {
    try {
      await this.repo.startRelay();
    }
    catch (e) {
      console.log(e);
      window.location.reload();
    }
  }

  async starStrategy(): Promise<void> {
    try {
      await this.repo.startStrategy();
    }
    catch (e) {
      console.log(e);
      window.location.reload();
    }
  }

  async removeTeam(teamId: string): Promise<void> {
    await this.repo.removeTeam(teamId);
  }

  // The saved match goes first, synchronously: it must not survive a logout
  // request that fails, and another team may be next at this computer. The
  // marker goes last, once the session is really over: removing it is what
  // the other tabs hear, and a key already removed by a failed attempt would
  // fire no `storage` event when the retry succeeds.
  async logout(): Promise<void> {
    localStorage.removeItem(legacyGuidStorageKey());
    localStorage.removeItem(teamStateStorageKey());
    localStorage.removeItem(relayPointsStorageKey());
    localStorage.removeItem(strategyPointsStorageKey());
    removeGameStateLocalStorage();
    await this.repo.logout();
    localStorage.removeItem(loginMarkerStorageKey());
  }

  async login(joinCode: string): Promise<void> {
    await this.repo.joinWithCode(joinCode);
    localStorage.setItem(loginMarkerStorageKey(), "1");
  }

  async toHome(): Promise<void> {
    try {
      await this.repo.toHome();
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
      const onLoginChanged = async (event: StorageEvent) => {
        if (event.key !== loginMarkerStorageKey()) {
          return;
        }

        const value = await this.getTeamState();

        if (previousValue !== value) {
          setTeamState(value);
          previousValue = value;
        }
      };
      window.addEventListener("storage", (event) => {
        void onLoginChanged(event);
      });
    }
  }
}
