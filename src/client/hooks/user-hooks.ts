
import { UserModel } from "./user-model";
import { useRecoilState } from 'recoil';
import { currentStateAtom } from "./user-atom";
import { TeamModelDto } from "../dto/TeamStateDto";

const userModel = new UserModel();

export const useTeamState = (): TeamModelDto | null => {
  const [teamState, setTeamState] = useRecoilState(currentStateAtom);

  return teamState;
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
