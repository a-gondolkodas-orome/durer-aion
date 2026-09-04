import { TeamModel } from "./model";
import { MatchStatus } from "schemas";

/** What the playing client is served for its own team.
 *
 * The team routes are reachable with nothing but the team's GUID, so the row
 * must never travel whole: `joinCode` is the team's login secret, `email`
 * identifies the people behind the team, and `other` carries the organisers'
 * notes. `credentials` stays because the board client signs its moves with it.
 */
export interface PublicTeamView {
  teamId: string;
  teamName: string;
  category: string;
  credentials: string;
  pageState: TeamModel["pageState"];
  relayMatch: MatchStatus;
  strategyMatch: MatchStatus;
}

/** Narrows a team row to {@link PublicTeamView}.
 *
 * Listing the fields rather than deleting the secret ones is deliberate: a
 * column added to the model later stays out of the response until someone
 * decides it belongs here.
 */
export function publicTeamView(team: TeamModel): PublicTeamView {
  return {
    teamId: team.teamId,
    teamName: team.teamName,
    category: team.category,
    credentials: team.credentials,
    pageState: team.pageState,
    relayMatch: team.relayMatch,
    strategyMatch: team.strategyMatch,
  };
}
