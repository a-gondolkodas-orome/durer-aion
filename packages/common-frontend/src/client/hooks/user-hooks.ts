import { UserModel } from "./user-model";
import { setTeamState, useTeamStateValue } from "./team-state-store";
import { TeamModelDto } from "../dto/TeamStateDto";
import { useEffect } from "react";
import { useAdminRepo, useClientRepo } from "../client-repo-context";

export const useTeamState = (): TeamModelDto | null => {
  return useTeamStateValue();
};

export const LoadTeamState = () => {
  const repo = useClientRepo();

  useEffect(() => {
      if (typeof window === 'undefined') {
          return;
      }

      const userModel = new UserModel(repo);

      userModel
          .getTeamState()
          .then(teamState => {
            setTeamState(teamState);
          })
          .catch((e: unknown) => {
            console.error("could not load the team state", e);
          });

      return userModel.addListener(setTeamState);
  }, [repo]);

  return null;
};

export const useRefreshTeamState = () => {
  const repo = useClientRepo();
  return async () => {
    const userModel = new UserModel(repo);
    const state = await userModel.getTeamState();
    setTeamState(state);
  };
};

export const useAll = () => {
  const repo = useAdminRepo();
  return async () => await repo.getAll();
};

export const useGetLogs = () => {
  const repo = useAdminRepo();
  return async (matchId: string) => await repo.getMatchLogs(matchId);
};

export const useMatchState = () => {
  const repo = useAdminRepo();
  return async (matchId: string) => await repo.getMatchState(matchId);
};

export const useResetRelay = () => {
  const repo = useAdminRepo();
  return async (teamId: string) => await repo.resetRelay(teamId);
};

export const useResetStrategy = () => {
  const repo = useAdminRepo();
  return async (teamId: string) => await repo.resetStrategy(teamId);
};

export const useAddMinutes = () => {
  const repo = useAdminRepo();
  return async (matchId: string, minutes: number) => { await repo.addMinutes(matchId, minutes); };
};

export const useLogin = () => {
  const repo = useClientRepo();
  return async (joinCode: string) => {
    const userModel = new UserModel(repo);
    await userModel.login(joinCode);

    const state = await userModel.getTeamState();
    setTeamState(state);
  }
};

// Rejects when the session could not be ended, and then leaves the team
// shown: a login form over a cookie that is still alive would only log the
// team back in on the next reload. The caller reports the failure.
export const useLogout = () => {
  const repo = useClientRepo();
  return async () => {
    const userModel = new UserModel(repo);
    await userModel.logout();
    setTeamState(null);
  };
};

export const useStartRelay = () => {
  const repo = useClientRepo();
  return async () => {
    const userModel = new UserModel(repo);
    await userModel.startRelay()
    const state = await userModel.getTeamState();
    setTeamState(state);
  };
};

export const useToHome = () => {
  const repo = useClientRepo();
  return async () => {
    const userModel = new UserModel(repo);
    await userModel.toHome()
    const state = await userModel.getTeamState();
    setTeamState(state);
  };
};

/**
 * A finished match's way back: home, then a reload, or `instead` of the reload
 * (the relay practice site logs out to its round selector). The handler is
 * synchronous because React ignores what an event handler returns, so an async
 * one would leave its promise unhandled.
 */
export const useBackToHome = (instead?: () => Promise<void>) => {
  const refreshState = useRefreshTeamState();
  const toHome = useToHome();
  return () => void (async () => {
    await refreshState();
    await toHome();
    if (instead) {
      await instead();
    } else {
      window.location.reload();
    }
  })();
};

export const useStartStrategy = () => {
  const repo = useClientRepo();
  return async () => {
    const userModel = new UserModel(repo);
    await userModel.starStrategy()
    const state = await userModel.getTeamState();
    setTeamState(state);
  };
};

export const useImportTeams = () => {
  const repo = useAdminRepo();
  return async (file: File) => await repo.importTeams(file);
};
