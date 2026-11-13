import { UserModel } from "./user-model";
import { currentTeamState, setTeamState, useTeamStateValue } from "./team-state-store";
import { TeamModelDto } from "../dto/TeamStateDto";
import { useEffect } from "react";
import { useSnackbar } from "notistack";
import i18next from "i18next";
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

// Where the team stands, as far as a refused request could have moved it: the
// page, and whether each match has started or ended.
const stage = (team: TeamModelDto | null) =>
  team && [team.pageState, team.relayMatch.state, team.strategyMatch.state].join();

/**
 * Sends a request that changes the team's page, then shows the team's state as
 * it now stands — refused or not, and never by reloading the page (#112). A
 * refusal is often its own answer: another device started the match first, or
 * the session ended, and the fetched state shows that. Only a refusal that
 * leaves the team where it was, or a fetch that fails as well, is reported, and
 * then the page stays as it is, for the team to try again.
 */
const useRequestThenRefetch = (request: (userModel: UserModel) => Promise<void>) => {
  const repo = useClientRepo();
  const { enqueueSnackbar } = useSnackbar();
  return async () => {
    const userModel = new UserModel(repo);
    const before = stage(currentTeamState());
    let refused = false;
    try {
      await request(userModel);
    } catch {
      // Why it was refused is nothing the team can act on; where it left them,
      // fetched next, is.
      refused = true;
    }
    let state: TeamModelDto | null;
    try {
      state = await userModel.getTeamState();
    } catch {
      enqueueSnackbar(i18next.t('error.unexpected'), { variant: 'error' });
      return;
    }
    setTeamState(state);
    if (refused && stage(state) === before) {
      enqueueSnackbar(i18next.t('error.unexpected'), { variant: 'error' });
    }
  };
};

export const useStartRelay = () => useRequestThenRefetch(userModel => userModel.startRelay());

export const useToHome = () => useRequestThenRefetch(userModel => userModel.toHome());

export const useViewStrategy = () => useRequestThenRefetch(userModel => userModel.viewStrategy());

/**
 * A finished match's way back: home, then `then` (the relay practice site logs
 * out to its round selector). No reload: the new team state alone takes `Main`
 * to the Chooser and unmounts the game client (#112). The handler is
 * synchronous because React ignores what an event handler returns, so an async
 * one would leave its promise unhandled.
 */
// Module state, not a ref: the end dialog's onClose and its card's button each
// hold their own useBackToHome, and either may fire while the other's way home
// is still under way.
let goingHome = false;

export const useBackToHome = (then?: () => Promise<void>) => {
  const toHome = useToHome();
  return () => {
    if (goingHome) {
      return;
    }
    goingHome = true;
    void (async () => {
      try {
        await toHome();
        await then?.();
      } finally {
        goingHome = false;
      }
    })();
  };
};

export const useStartStrategy = () => useRequestThenRefetch(userModel => userModel.starStrategy());

export const useImportTeams = () => {
  const repo = useAdminRepo();
  return async (file: File) => await repo.importTeams(file);
};

export const useCompetitions = () => {
  const repo = useAdminRepo();
  return async () => await repo.getCompetitions();
};
