import { validateStartWindow } from "schemas";
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

/** A team's own window as the admin route's body gives it, as the row's two
 *  columns, or the reason it is not one. A null `opensAt` clears the window. */
export function readTeamStartWindow(body: unknown):
  { opensAt: string | null, closesAt: string | null } | { refused: string } {
  const { opensAt = null, closesAt = null } = (typeof body === "object" && body !== null ? body : {}) as
    Record<string, unknown>;
  if (opensAt === null) {
    return closesAt === null ? { opensAt: null, closesAt: null } : { refused: "closesAt needs an opensAt." };
  }
  if (typeof opensAt !== "string" || (closesAt !== null && typeof closesAt !== "string")) {
    return { refused: "opensAt and closesAt are strings or null." };
  }
  const errors = validateStartWindow({ opensAt, ...(closesAt !== null && { closesAt }) });
  return errors.length > 0 ? { refused: errors.join("; ") } : { opensAt, closesAt };
}
