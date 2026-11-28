import { UserModel } from "./user-model";
import { currentTeamState, setTeamState, useTeamStateValue } from "./team-state-store";
import { TeamModelDto } from "../dto/TeamStateDto";
import type { CompetitionConfig } from "schemas";
import { useEffect } from "react";
import { useSnackbar } from "notistack";
import { useAdminRepo, useClientRepo } from "../client-repo-context";
import { errorMessage } from "../utils/i18n-error";
import i18next from "i18next";

/// `undefined` until the first `team/me` answer, `null` for no team logged in.
export const useTeamState = (): TeamModelDto | null | undefined => {
  return useTeamStateValue();
};

export const LoadTeamState = () => {
  const repo = useClientRepo();
  const { enqueueSnackbar } = useSnackbar();

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
            // The team stays unknown rather than logged out: a login form
            // would tell a logged-in team its session is gone. Nothing else is
            // on the page, so the message stays until a reload.
            enqueueSnackbar(errorMessage(e, i18next.t), { variant: 'error', persist: true });
          });

      return userModel.addListener(setTeamState);
  }, [repo, enqueueSnackbar]);

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

export const useSetStartWindow = () => {
  const repo = useAdminRepo();
  return async (teamId: string, window: { opensAt: string | null, closesAt: string | null }) =>
    await repo.setStartWindow(teamId, window);
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
const stage = (team: TeamModelDto | null | undefined) =>
  team && [team.pageState, team.relayMatch.state, team.strategyMatch.state].join();

/**
 * Sends a request that changes the team's page, then shows the team's state as
 * it now stands — refused or not, and never by reloading the page (#112). A
 * refusal is often its own answer: another device started the match first, or
 * the session ended, and the fetched state shows that. Only a refusal that
 * leaves the team where it was, or a fetch that fails as well, is reported —
 * with the server's reason, such as a start window not yet open — and then the
 * page stays as it is, for the team to try again.
 */
const useRequestThenRefetch = (request: (userModel: UserModel) => Promise<void>) => {
  const repo = useClientRepo();
  const { enqueueSnackbar } = useSnackbar();
  return async () => {
    const userModel = new UserModel(repo);
    const before = stage(currentTeamState());
    let refusal: { reason: unknown } | null = null;
    try {
      await request(userModel);
    } catch (e: unknown) {
      refusal = { reason: e };
    }
    let state: TeamModelDto | null;
    try {
      state = await userModel.getTeamState();
    } catch (e: unknown) {
      enqueueSnackbar(errorMessage(e, i18next.t), { variant: 'error' });
      return;
    }
    setTeamState(state);
    if (refusal && stage(state) === before) {
      enqueueSnackbar(errorMessage(refusal.reason, i18next.t), { variant: 'error' });
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

export const useImportCompetitions = () => {
  const repo = useAdminRepo();
  return async (bundle: unknown) => await repo.importCompetitions(bundle);
};

export const useExportCompetitions = () => {
  const repo = useAdminRepo();
  return async () => await repo.exportCompetitions();
};

export const useCompetitions = () => {
  const repo = useAdminRepo();
  return async () => await repo.getCompetitions();
};

export const useCompetition = () => {
  const repo = useAdminRepo();
  return async (competitionId: string) => await repo.getCompetition(competitionId);
};

export const useSaveCompetition = () => {
  const repo = useAdminRepo();
  return async (competition: CompetitionConfig, options: { dryRun: boolean }) =>
    await repo.saveCompetition(competition, options);
};

