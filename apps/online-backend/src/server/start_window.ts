import type { CompetitionConfig, StartWindow } from "schemas";
import type { TeamModel } from "./model";

/** The window the team may start its matches in: its own if it has one, else
 *  its competition's. None means any time. */
export function teamStartWindow(
  team: Pick<TeamModel, "startOpensAt" | "startClosesAt">,
  competition: Pick<CompetitionConfig, "startWindow"> | undefined,
): StartWindow | undefined {
  if (team.startOpensAt !== null) {
    return { opensAt: team.startOpensAt, ...(team.startClosesAt !== null && { closesAt: team.startClosesAt }) };
  }
  return competition?.startWindow;
}
