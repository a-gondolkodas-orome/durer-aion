import type { PostgresStore } from 'bgio-postgres';
import { InProgressMatchStatus, teamAttributes, TeamModel } from './entities/teamModel';
import { Sequelize, Op, WhereOptions } from 'sequelize';
import { relayProblemAttributes, RelayProblemModel } from './entities/relayProblemModel';
import { parseProblemTOML } from './problemTOMLParse';

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

function relayImageNameToUrl(name: string): string {
  return `https://durerimages.s3.eu-north-1.amazonaws.com/` + name; // TODO idk what this should be
}

export class RelayProblemsRepository {
  sequelize: Sequelize;
  
  constructor(db: PostgresStore) {
    this.sequelize = db.sequelize;
    RelayProblemModel.init(relayProblemAttributes, {
      sequelize: db.sequelize,
      tableName: "RelayProblems",
    });
  }

  async connect() {
    await this.sequelize.sync();
  }

  async getProblems(category: string): Promise<RelayProblemModel[]> {
    return await RelayProblemModel.findAll({
      where: {
        category: category
      },
      order: [['index', 'ASC']]
    });
  }

  async addProblem(
      { category, index, problemText, answer, points, imageUrls } : 
      { category: string, index: number, problemText: string, answer: string, points: number, imageUrls: string[] }) {
    return await RelayProblemModel.create({
      category, index, problemText, answer, points, imageUrls
    });
  }

  async addFromTOML(toml: string, imgNames: string[]) {
    const parsedProblems = parseProblemTOML(toml, imgNames);
    const promises = parsedProblems.map(problem => {
      return RelayProblemModel.create({
        category: problem.category,
        index: problem.index,
        problemText: problem.problemText,
        answer: problem.answer,
        points: problem.points,
        imageUrl: problem.attachment ? relayImageNameToUrl(problem.attachment) : null,
      });
    });
    return await Promise.all(promises);
  }
}
