import { UserModel } from "./user-model";
import { useRecoilState } from 'recoil';
import { currentStateAtom } from "./user-atom";
import { TeamModelDto } from "../dto/TeamStateDto";
import { useEffect } from "react";
import { useClientRepo } from "../api-repository-interface";

export const useTeamState = (): TeamModelDto | null => {
  const [teamState, ] = useRecoilState(currentStateAtom);

  return teamState;
};

export const LoadTeamState = () => {
  const repo = useClientRepo();
  const [, setTeamState] = useRecoilState(currentStateAtom);

  useEffect(() => {
      if (typeof window === 'undefined') {
          return;
      }

      const userModel = new UserModel(repo);

      userModel
          .getTeamState()
          .then(teamState => {
            setTeamState(teamState);
          });

      
          userModel.addListener(setTeamState);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

export const useRefreshTeamState = () => {
  const [, setTeamState] = useRecoilState(currentStateAtom);
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
    return await userModel.resetRealy(teamId);
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
  const [, setTeamState] = useRecoilState(currentStateAtom);
  return async (joinCode: string) => {
    const userModel = new UserModel(repo);
    console.log("joinCode", joinCode);
    const res = await userModel.login(joinCode);
    console.log("res", res);

    const state = await userModel.getTeamState();
    console.log("useLogin", state);
    setTeamState(state);
  }
};

export const useLogout = () => {
  const repo = useClientRepo();
  const [, setTeamState] = useRecoilState(currentStateAtom);
  return () => {
    const userModel = new UserModel(repo);
    userModel.logout();
    setTeamState(null);
  };
};

export const useStartRelay = () => {
  const repo = useClientRepo();
  const [, setTeamState] = useRecoilState(currentStateAtom);
  return async () => {
    const userModel = new UserModel(repo);
    await userModel.startRelay()
    const state = await userModel.getTeamState();
    setTeamState(state);
  };
};

export const useToHome = () => {
  const [, setTeamState] = useRecoilState(currentStateAtom);
  const repo = useClientRepo();
  return async () => {
    const userModel = new UserModel(repo);
    await userModel.toHome()
    const state = await userModel.getTeamState();
    setTeamState(state);
  };
};

export const useStartStrategy = () => {
  const [, setTeamState] = useRecoilState(currentStateAtom);
  const repo = useClientRepo();
  return async () => {
    const userModel = new UserModel(repo);
    await userModel.starStrategy()
    const state = await userModel.getTeamState();
    setTeamState(state);
  };
};
