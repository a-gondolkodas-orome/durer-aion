import { UserModel } from "./user-model";
import { setTeamState, useTeamStateValue } from "./team-state-store";
import { TeamModelDto } from "../dto/TeamStateDto";
import { useEffect } from "react";
import { useClientRepo } from "../api-repository-interface";

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


          userModel.addListener(setTeamState);
  }, []);

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
  const repo = useClientRepo();
  return async () => {
    const userModel = new UserModel(repo);
    return await userModel.adminAll();
  };
};

export const useGetLogs = () => {
  const repo = useClientRepo();
  return async (matchId: string) => {
    const userModel = new UserModel(repo);
    return await userModel.adminGetLogs(matchId);
  };
};

export const useMatchState = () => {
  const repo = useClientRepo();
  return async (matchId: string) => {
    const userModel = new UserModel(repo);
    return await userModel.adminMatchState(matchId);
  };
};

export const useResetRelay = () => {
  const repo = useClientRepo();
  return async (teamId: string) => {
    const userModel = new UserModel(repo);
    return await userModel.resetRelay(teamId);
  };
};

export const useResetStrategy = () => {
  const repo = useClientRepo();
  return async (teamId: string) => {
    const userModel = new UserModel(repo);
    return await userModel.resetStrategy(teamId);
  };
};

export const useAddMinutes = () => {
  const repo = useClientRepo();
  return async (matchId: string, minutes: number) => {
    const userModel = new UserModel(repo);
    return await userModel.addMinutes(matchId, minutes);
  };
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

export const useStartStrategy = () => {
  const repo = useClientRepo();
  return async () => {
    const userModel = new UserModel(repo);
    await userModel.starStrategy()
    const state = await userModel.getTeamState();
    setTeamState(state);
  };
};

export const useRemoveTeam = () => {
  const repo = useClientRepo();
  return async (teamId: string) => {
    await repo.removeTeam(teamId);
  };
};
