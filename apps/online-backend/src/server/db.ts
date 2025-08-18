import type { PostgresStore } from 'bgio-postgres';
import { InProgressMatchStatus } from 'schemas';
import { teamAttributes, TeamModel } from './model';
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
    // TODO: Like-injection
    return await TeamModel.findAll({ where:
      Sequelize.and(...filter.map(part => ({'other': { [Op.like]: `%${part}%`} }))),
    });
  }

  async deduceMatch(matchID:string):Promise<TeamModel|null>{
    const matches =  await TeamModel.findAll( {where:
      Sequelize.or([
        {relayMatch:'IN PROGRESS'},
        {strategyMatch:'IN PROGRESS'}
      ])
    });
    console.log(matches)
    return matches.find(team =>{
      return (team.relayMatch as InProgressMatchStatus).matchID === matchID || 
        (team.strategyMatch as InProgressMatchStatus).matchID === matchID
    })??null;
  }

  async listTeams(): Promise<TeamModel[]|null>{
    return await TeamModel.findAll();
  }

  async getTeam(searchCondition: WhereOptions<Pick<TeamModel, "joinCode" | "teamId">>) : Promise<TeamModel|null>{
    return await TeamModel.findOne( {where:
      (searchCondition)
    });
  }
  async insertTeam(
      { teamname, category, email, other, teamId, joinCode, credentials } :
      { teamname: string, category: string, email: string, other: string, teamId: string, joinCode: string, credentials: string}) {
    return await TeamModel.create({
      teamId, joinCode, other,
      category,
      email,
      credentials,
      strategyMatch: {state: "NOT STARTED"},
      relayMatch: {state: "NOT STARTED"},
      teamName: teamname,
      pageState: 'DISCLAIMER',
    });
  }
}
