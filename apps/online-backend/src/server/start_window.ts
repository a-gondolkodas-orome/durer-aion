import { formatFinding, validateStartWindow } from "schemas";
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

/** The competition with the window organisers set on the admin page in place
 *  of its config's one, so whatever reads its `startWindow` reads the window
 *  in force. */
export function withCompetitionWindow(
  competition: CompetitionConfig | undefined,
  windows: ReadonlyMap<string, StartWindow>,
): CompetitionConfig | undefined {
  if (competition === undefined) return undefined;
  const window = windows.get(competition.id);
  return window === undefined ? competition : { ...competition, startWindow: window };
}

/** A start window as an admin route's body gives it, `{ opensAt, closesAt }`,
 *  or the reason it is not one. A null `opensAt` means no window of its own:
 *  `null` is what the route then stores. */
export function readStartWindowBody(body: unknown): StartWindow | null | { refused: string } {
  const { opensAt = null, closesAt = null } = (typeof body === "object" && body !== null ? body : {}) as
    Record<string, unknown>;
  if (opensAt === null) {
    return closesAt === null ? null : { refused: "closesAt needs an opensAt." };
  }
  if (typeof opensAt !== "string" || (closesAt !== null && typeof closesAt !== "string")) {
    return { refused: "opensAt and closesAt are strings or null." };
  }
  const window: StartWindow = { opensAt, ...(closesAt !== null && { closesAt }) };
  const findings = validateStartWindow(window);
  return findings.length > 0 ? { refused: findings.map(formatFinding).join("; ") } : window;
}
