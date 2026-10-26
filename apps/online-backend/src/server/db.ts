import { PostgresStore } from 'bgio-postgres';
import { env } from 'process';
import { FinishedMatchStatus, InProgressMatchStatus } from 'schemas';
import { teamAttributes, TeamModel } from './model';
import { Sequelize, Op, WhereOptions } from 'sequelize';

// `%` and `_` are wildcards inside a LIKE or ILIKE pattern, so a fragment
// carrying them would match more than the caller asked for — a bare `%` matches
// every team. Backslash is postgres' default escape character for both, so no
// ESCAPE clause is needed; it has to escape itself too, or a trailing one would
// escape the `%` that the pattern appends.
export function escapeLike(fragment: string): string {
  return fragment.replace(/[\\%_]/g, character => `\\${character}`);
}

export class TeamsRepository {
  sequelize: Sequelize;
  constructor(db: PostgresStore) {
    this.sequelize = db.sequelize;
    TeamModel.init(teamAttributes, {
      sequelize: db.sequelize,
      tableName: "Teams",
    });
  }
  async connect() {
    await this.sequelize.sync();
  }
  /**
   * Teams whose `other` field contains every one of the given fragments,
   * whatever their case: the column is the organisers' own notes, so what an
   * organiser types is a fragment they remember rather than the case it was
   * stored in. An empty list matches all teams: `Sequelize.and()` with no
   * arguments produces no WHERE clause.
   *
   * `ILIKE` folds case the way the database's own locale says, so the accented
   * letters fold only on a UTF-8 aware one: on a cluster initialised with plain
   * `C`, `Ő` and `ő` stay different while ASCII still folds. Accents are not
   * folded away on any locale — `Adam` does not find `Ádám`.
   */
  async fetch(filter: string[]) : Promise<TeamModel[]> {
    return await TeamModel.findAll({ where:
      Sequelize.and(...filter.map(part => ({ 'other': { [Op.iLike]: `%${escapeLike(part)}%` } }))),
    });
  }

  async deduceMatch(matchID:string):Promise<TeamModel | null> {
    const matches =  await TeamModel.findAll({ where:
      Sequelize.or([
        { relayMatch: 'IN PROGRESS' },
        { strategyMatch: 'IN PROGRESS' }
      ])
    });
    console.log(matches)
    return matches.find(team => {
      return (team.relayMatch as InProgressMatchStatus).matchID === matchID ||
        (team.strategyMatch as InProgressMatchStatus).matchID === matchID
    }) ?? null;
  }

  async listTeams(): Promise<TeamModel[] | null> {
    return await TeamModel.findAll();
  }

  async getTeam(searchCondition: WhereOptions<Pick<TeamModel, "joinCode" | "teamId">>) : Promise<TeamModel | null> {
    return await TeamModel.findOne({ where:
      (searchCondition)
    });
  }
  /**
   * Records the team's match as finished, but only while that match is still
   * the team's: the match id is checked in the same UPDATE that writes, so an
   * admin reset landing after the caller read the team is not overwritten.
   * Whether a row was written.
   */
  async finishMatch(
    teamId: string,
    type: "relayMatch" | "strategyMatch",
    matchId: string,
    status: FinishedMatchStatus,
  ): Promise<boolean> {
    const [updated] = await TeamModel.update({ [type]: status }, {
      // A JSON path on the column: ("strategyMatch"#>>'{matchID}') = matchId.
      where: { teamId, [type]: { matchID: matchId } } as WhereOptions<TeamModel>,
    });
    return updated > 0;
  }
  async insertTeam(
      { teamname, category, email, other, teamId, joinCode, credentials } :
      { teamname: string, category: string, email: string, other: string, teamId: string, joinCode: string, credentials: string }) {
    return await TeamModel.create({
      teamId, joinCode, other,
      category,
      email,
      credentials,
      strategyMatch: { state: "NOT STARTED" },
      relayMatch: { state: "NOT STARTED" },
      teamName: teamname,
      pageState: 'DISCLAIMER',
    });
  }
}

// The one connection every entry opens: the server needs both halves — the
// store is boardgame.io's match state and the repository the teams beside it —
// while the team import needs only the repository.
export function getDb() {
  if (!env.DATABASE_URL) {
    throw new Error('Failed to load DB data. Only postgres is supported!');
  }
  const db = new PostgresStore(env.DATABASE_URL, { logging: false });
  return {
    db,
    teams: new TeamsRepository(db),
  };
}
