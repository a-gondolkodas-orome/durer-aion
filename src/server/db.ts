import type { PostgresStore } from 'bgio-postgres';
import { teamAttributes, TeamModel } from './entities/model';
import { Sequelize } from 'sequelize';

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
    
    return await TeamModel.findAll({ where:
      Sequelize.and(...filter.map(part => ({'other': part}))),
    });
  }
}
