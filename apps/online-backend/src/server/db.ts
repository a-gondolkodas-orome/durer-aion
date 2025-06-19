import type { PostgresStore } from 'bgio-postgres';
import { InProgressMatchStatus } from 'schemas';
import { teamAttributes, TeamModel } from './entities/teamModel';
import { EventModel, eventAttributes } from './entities/event';
import { DeletedTeamModel, deletedTeamAttributes } from './entities/deletedTeam';
import { Sequelize, Op, WhereOptions } from 'sequelize';

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

  async removeTeam(teamId: string): Promise<number> {
    const team = await TeamModel.findOne({ where: { teamId } });
    if (!team) return 0;
    try {
      await DeletedTeamModel.create({
      ...team.toJSON(),
      deletedAt: new Date(),
    });
    }catch (e) {
      console.error('Failed to create DeletedTeamModel entry:', e);
      
    }
    return await TeamModel.destroy({ where: { teamId } });
  }
}
