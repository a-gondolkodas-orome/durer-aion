import type { PostgresStore } from 'bgio-postgres';
import { InProgressMatchStatus } from 'schemas';
import { teamAttributes, TeamModel } from './model';
import { DeletedTeamModel, deletedTeamAttributes } from './deletedTeam';
import { Sequelize, Op, Transaction, WhereOptions } from 'sequelize';

// `%` and `_` are wildcards inside a LIKE pattern, so a fragment carrying them
// would match more than the caller asked for — a bare `%` matches every team.
// Backslash is postgres' default LIKE escape character, so no ESCAPE clause is
// needed; it has to escape itself too, or a trailing one would escape the `%`
// that the pattern appends.
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
    DeletedTeamModel.init(deletedTeamAttributes, {
      sequelize: db.sequelize,
      tableName: "DeletedTeams",
    });
  }
  async connect() {
    await this.sequelize.sync();
  }
  /**
   * Teams whose `other` field contains every one of the given fragments.
   * An empty list matches all teams: `Sequelize.and()` with no arguments
   * produces no WHERE clause.
   */
  async fetch(filter: string[]) : Promise<TeamModel[]> {
    return await TeamModel.findAll({ where:
      Sequelize.and(...filter.map(part => ({ 'other': { [Op.like]: `%${escapeLike(part)}%` } }))),
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

  /**
   * Copies the team into `DeletedTeams`, then drops it: how many were dropped,
   * so 0 for a team that was not there. One transaction, so a failure between
   * the two statements leaves both tables as they were rather than a team gone
   * without its copy; and the row is locked while it is read, so two admins
   * deleting the same team at once archive it once, and the second is told it
   * was not there.
   *
   * The team's matches stay. The archived row keeps both match ids, and the
   * match rows are the record of what was played.
   */
  async removeTeam(teamId: string): Promise<number> {
    return await this.sequelize.transaction(async transaction => {
      const team = await TeamModel.findOne({ where: { teamId }, transaction, lock: Transaction.LOCK.UPDATE });
      if (!team) return 0;
      await DeletedTeamModel.create({
        ...team.toJSON(),
        deletedAt: new Date(),
      }, { transaction });
      return await TeamModel.destroy({ where: { teamId }, transaction });
    });
  }
}
