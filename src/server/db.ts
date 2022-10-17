import type { PostgresStore } from 'bgio-postgres';
import { teamAttributes, TeamModel } from './entities/model';
import { Sequelize, Op, WhereOptions } from 'sequelize';

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
  async fetch(filter: string[]) : Promise<TeamModel[]> {
    // TODO Like-injection
    return await TeamModel.findAll({ where:
      Sequelize.and(...filter.map(part => ({'other': { [Op.like]: `%${part}%`} }))),
    });
  }

  async getTeam(searchCondition: WhereOptions<Pick<TeamModel, "joinCode" | "credentials">>) : Promise<TeamModel|null>{
    return await TeamModel.findOne( {where:
      (searchCondition)
    });
  }
  async insertTeam(
      { teamname, category, email, other, id, joinCode, credentials } :
      { teamname: string, category: string, email: string, other: string, id: string, joinCode: string, credentials: string}) {
    return await TeamModel.create({
      id, joinCode, other,
      category,
      email,
      credentials,
      strategyMatch: {state: "NOT STARTED"},
      relayMatch: {state: "NOT STARTED"},
      teamName: teamname,
      pageState: 'INIT',
    });
  }
}
