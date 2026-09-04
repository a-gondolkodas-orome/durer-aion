import { TeamModel } from "./model";
import { MatchStatus } from "schemas";

/** What the playing client is served for its own team.
 *
 * The row must never travel whole: `joinCode` is the team's login secret,
 * `email` identifies the people behind the team, and `other` carries the
 * organisers' notes.
 *
 * `teamId` is left out for the same reason, and it is the one that matters
 * most: the GUID is the session cookie's value, and a browser may set a
 * cookie of its own under that name, so anyone holding a team's GUID can be
 * that team. Nothing the team plays with needs it — the board signs its moves
 * with `credentials` and addresses the match by `matchID`, and the admin pages
 * take the GUID from their own authenticated route.
 *
 * Leaving it out narrows where the session travels rather than putting it
 * beyond a page script's reach — boardgame.io discloses the same GUID by
 * another route. `server/team_session.ts` has the threat model and issue #434
 * the fix.
 */
export interface PublicTeamView {
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
    teamName: team.teamName,
    category: team.category,
    credentials: team.credentials,
    pageState: team.pageState,
    relayMatch: team.relayMatch,
    strategyMatch: team.strategyMatch,
  };
}
