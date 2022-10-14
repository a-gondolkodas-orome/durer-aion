import type { PostgresStore } from 'bgio-postgres';
import { teamAttributes, TeamModel } from './entities/model';
import { Sequelize, Op } from 'sequelize';

export class TeamsRepository {
  sequelize: Sequelize;
  constructor(db: PostgresStore) {
    this.sequelize = db.sequelize;
    TeamModel.init(teamAttributes, {
      sequelize: db.sequelize,
      tableName: "Teams",
    });
  }
  connect() {
    this.sequelize.sync();
  }
  async fetch(filter: string[]) : Promise<TeamModel[]> {
    // TODO Like-injection
    return await TeamModel.findAll({ where:
      Sequelize.and(...filter.map(part => ({'other': { [Op.like]: `%${part}%'`} }))),
    });
  }
  async insertTeam(
      { teamname, category, email, other, id, joinCode } :
      { teamname: string, category: string, email: string, other: string, id: string, joinCode: string}) {
    let team = new TeamModel();
//    team.createdAt = moment.now()
    team.id = id;
    team.joinCode = joinCode;
    team.other = other;
//    team.category = category;
    team.strategyMatch = {state: "NOT STARTED"};
    team.relayMatch = {state: "NOT STARTED"};
    team.teamName = teamname;
    team.pageState = 'INIT';
    await team.save();
  }
}
