import { TeamModel } from "./model";
import { MatchStatus, publicCompetition } from "schemas";
import type { CompetitionConfig, PublicCompetition, StartWindow } from "schemas";
import { teamStartWindow } from "./start_window";
import { registry } from "problem-bank/all";
import type { TeamMatches } from "./match_status";

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
  /** What the client builds its boards from: which matches there are, how
   *  long each runs and in which languages. Null for a row naming a
   *  competition the server no longer has, which has nothing to play. */
  competition: PublicCompetition | null;
  /** When the team may start its matches: its own window or its
   *  competition's. Null when it may start at any time. */
  startWindow: StartWindow | null;
  /** The server's clock as it answers, ISO 8601: the page judges the start
   *  window by it rather than by the browser's clock, which may be off. */
  serverTime: string;
  credentials: string;
  pageState: TeamModel["pageState"];
  relayMatch: MatchStatus;
  strategyMatch: MatchStatus;
}

/** Narrows a team row, with its matches as they stand, to {@link PublicTeamView}.
 *
 * Listing the fields rather than deleting the secret ones is deliberate: a
 * column added to the model later stays out of the response until someone
 * decides it belongs here.
 */
export function publicTeamView(
  team: TeamModel,
  matches: TeamMatches,
  competitions: ReadonlyMap<string, CompetitionConfig> = registry.competitions,
  now: Date = new Date(),
): PublicTeamView {
  const competition = competitions.get(team.competitionId);
  return {
    teamName: team.teamName,
    category: team.category,
    competition: competition === undefined ? null : publicCompetition(competition),
    startWindow: teamStartWindow(team, competition) ?? null,
    serverTime: now.toISOString(),
    credentials: team.credentials,
    pageState: team.pageState,
    relayMatch: matches.relayMatch,
    strategyMatch: matches.strategyMatch,
  };
}
