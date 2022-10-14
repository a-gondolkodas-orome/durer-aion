import type { PostgresStore } from 'bgio-postgres';
import { teamAttributes, TeamModel } from './entities/model';
import { Sequelize, Op } from 'sequelize';
import { createMatch } from 'boardgame.io/internal';
import { getBotCredentials } from '../server';

export class TeamsRepository {
  sequelize: Sequelize;
  db: PostgresStore;
  constructor(db: PostgresStore) {
    this.sequelize = db.sequelize;
    this.db = db;
    TeamModel.init(teamAttributes, {
      sequelize: db.sequelize,
      tableName: "Teams",
    });
  }
  async connect() {
    await this.sequelize.sync();
  }
  async findTeam(id: string) : Promise<TeamModel | null> {
    return await TeamModel.findByPk(id);
  }
  async fetch(filter: string[]) : Promise<TeamModel[]> {
    // TODO Like-injection
    return await TeamModel.findAll({ where:
      Sequelize.and(...filter.map(part => ({'other': { [Op.like]: `%${part}%`} }))),
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
  async startRelay({id}: {id: string}) {
    // TODO Date handling?? Timezones, etc?
    const team = await this.findTeam(id);
    if (team === null) {
      throw new Error("Could not find team");
    }
    let games = // TODO;
    let game = games.find((g) => g.name === `relay-${team.category}`);
    let match = createMatch({
      game, numPlayers: 2, botCredentials: getBotCredentials(), setupData: null,
      unlisted: true,
    })
    TeamModel.upsert({
      id,
      relayMatch: {state: 'IN PROGRESS', startAt: new Date(), endAt: new Date(), matchID: match.metadata.matchID}
    })
  }
}
