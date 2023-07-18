
import { UserModel } from "./user-model";
import { useRecoilState } from 'recoil';
import { currentStateAtom } from "./user-atom";
import { TeamModelDto } from "../dto/TeamStateDto";
import { useEffect } from "react";

const userModel = new UserModel();

export const useTeamState = (): TeamModelDto | null => {
  const [teamState, setTeamState] = useRecoilState(currentStateAtom);

  return teamState;
};

export const LoadTeamState = () => {
  const [teamState, setTeamState] = useRecoilState(currentStateAtom);

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
  }, []);

  return null;
};

export const useRefreshTeamState = () => {
  const [teamState, setTeamState] = useRecoilState(currentStateAtom);
  return async () => {
    const state = await userModel.getTeamState();
    setTeamState(state);
  };
};

export const useLogin = () => {
  const [teamState, setTeamState] = useRecoilState(currentStateAtom);
  return async (joinCode: string) => {
    await userModel.login(joinCode);

    const state = await userModel.getTeamState();
    setTeamState(state);
  }
};

export const useLogout = () => {
  const [teamState, setTeamState] = useRecoilState(currentStateAtom);
  return () => {
    userModel.logout();
    setTeamState(null);
  };
};

export const useStartRelay = () => {
  const [teamState, setTeamState] = useRecoilState(currentStateAtom);
  return async () => {
    await userModel.startRelay()
    const state = await userModel.getTeamState();
    setTeamState(state);
  };
};

export const useFinishRelay = () => {
  const [teamState, setTeamState] = useRecoilState(currentStateAtom);
  return async (score: number) => {
    const state = await userModel.finishRelay(score)
    setTeamState(state);
  };
};

export const useStartStrategy = () => {
  const [teamState, setTeamState] = useRecoilState(currentStateAtom);
  return async () => {
    await userModel.starStrategy()
    const state = await userModel.getTeamState();
    setTeamState(state);
  };
};
