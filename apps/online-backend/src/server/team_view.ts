import { TeamModel } from "./model";
import { MatchStatus } from "schemas";

/** What the playing client is served for its own team.
 *
 * The row must never travel whole: `joinCode` is the team's login secret,
 * `email` identifies the people behind the team, and `other` carries the
 * organisers' notes.
 *
 * `teamId` is left out for the same reason, and it is the one that would
 * undo the session cookie: the GUID is the cookie's value, and a browser
 * may set a cookie of its own under that name, so anyone holding a team's
 * GUID can be that team. Keeping it out of the body is what makes the
 * cookie's `httpOnly` worth anything — otherwise a script on the page could
 * read `GET /team/me` and carry the session off (server/team_session.ts).
 * Nothing the team plays with needs it: the board signs its moves with
 * `credentials` and addresses the match by `matchID`, and the admin pages
 * take the GUID from their own authenticated route.
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
