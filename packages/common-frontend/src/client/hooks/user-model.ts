import type { ClientRepository } from "../api-repository-interface";
import type { TeamModelDto } from "../dto/TeamStateDto";
import { loginMarkerStorageKey } from "../utils/storage-keys";
import { clearStoredSession } from "../utils/stored-session";

export class UserModel {

  constructor(private repo: ClientRepository) {}

  // The session lives with the repository (online: an HttpOnly cookie), so
  // whether a team is logged in is only known by asking.
  async getTeamState(): Promise<TeamModelDto | null> {
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

  // The saved match goes first, synchronously: it must not survive a logout
  // request that fails, and another team may be next at this computer. The
  // marker goes last, once the session is really over: removing it is what
  // the other tabs hear, and a key already removed by a failed attempt would
  // fire no `storage` event when the retry succeeds.
  async logout(): Promise<void> {
    clearStoredSession();
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

  // Returns the function that removes the listener again.
  addListener(setTeamState: (teamState: TeamModelDto | null) => void): () => void {
    if (typeof window === "undefined") {
      return () => undefined;
    }
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
    const listener = (event: StorageEvent) => {
      void onLoginChanged(event);
    };
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }
}
