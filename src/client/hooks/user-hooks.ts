import { UserModel } from "./user-model";
import { useRecoilState } from 'recoil';
import { currentStateAtom } from "./user-atom";
import { TeamModelDto } from "../dto/TeamStateDto";
import { useEffect } from "react";

const userModel = new UserModel();

export const useTeamState = (): TeamModelDto | null => {
  const [teamState, ] = useRecoilState(currentStateAtom);

  return teamState;
};

export const LoadTeamState = () => {
  const [, setTeamState] = useRecoilState(currentStateAtom);

  useEffect(() => {
      if (typeof window === 'undefined') {
          return;
      }

      const userModel = new UserModel();

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
  return async () => {
    const state = await userModel.getTeamState();
    setTeamState(state);
  };
};

export const useAll = () => {
  return async () => {
    return await userModel.adminAll();
  };
};

export const useGetLogs = () => {
  return async (matchId: string) => {
    return await userModel.adminGetLogs(matchId);
  };
};

export const useMatchState = () => {
  return async (matchId: string) => {
    return await userModel.adminMatchState(matchId);
  };
};

export const useResetRelay = () => {
  return async (teamId: string) => {
    return await userModel.resetRealy(teamId);
  };
};

export const useResetStrategy = () => {
  return async (teamId: string) => {
    return await userModel.resetStrategy(teamId);
  };
};

export const useAddMinutes = () => {
  return async (matchId: string, minutes: number) => {
    return await userModel.addMinutes(matchId, minutes);
  };
};

export const useLogin = () => {
  const [, setTeamState] = useRecoilState(currentStateAtom);
  return async (joinCode: string) => {
    await userModel.login(joinCode);

    const state = await userModel.getTeamState();
    setTeamState(state);
  }
};

export const useLogout = () => {
  const [, setTeamState] = useRecoilState(currentStateAtom);
  return () => {
    userModel.logout();
    setTeamState(null);
  };
};

export const useStartRelay = () => {
  const [, setTeamState] = useRecoilState(currentStateAtom);
  return async () => {
    await userModel.startRelay()
    const state = await userModel.getTeamState();
    setTeamState(state);
  };
};

export const useToHome = () => {
  const [, setTeamState] = useRecoilState(currentStateAtom);
  return async () => {
    await userModel.toHome()
    const state = await userModel.getTeamState();
    setTeamState(state);
  };
};

export const useStartStrategy = () => {
  const [, setTeamState] = useRecoilState(currentStateAtom);
  return async () => {
    await userModel.starStrategy()
    const state = await userModel.getTeamState();
    setTeamState(state);
  };
};
