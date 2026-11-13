import { PostgresStore } from 'bgio-postgres';
import { env } from 'process';
import type { GameType, StartWindow } from 'schemas';
import { CompetitionWindowModel, competitionWindowAttributes, teamAttributes, TeamModel } from './model';
import { Sequelize, WhereOptions } from 'sequelize';

export class TeamsRepository {
  sequelize: Sequelize;
  constructor(db: PostgresStore) {
    this.sequelize = db.sequelize;
    TeamModel.init(teamAttributes, {
      sequelize: db.sequelize,
      tableName: "Teams",
    });
    CompetitionWindowModel.init(competitionWindowAttributes, {
      sequelize: db.sequelize,
      tableName: "CompetitionWindows",
    });
  }
  async connect() {
    await this.sequelize.sync();
  }
  async listTeams(): Promise<TeamModel[] | null> {
    return await TeamModel.findAll();
  }

  /** The start windows organisers set on the admin page, by competition id:
   *  each replaces the window its competition's config gives. */
  async competitionWindows(): Promise<Map<string, StartWindow>> {
    const rows = await CompetitionWindowModel.findAll();
    return new Map(rows.map(({ competitionId, opensAt, closesAt }) =>
      [competitionId, { opensAt, ...(closesAt !== null && { closesAt }) }]));
  }

  /** Sets the competition's window in place of its config's, or, with null,
   *  returns it to its config's. */
  async setCompetitionWindow(competitionId: string, window: StartWindow | null): Promise<void> {
    if (window === null) {
      await CompetitionWindowModel.destroy({ where: { competitionId } });
      return;
    }
    await CompetitionWindowModel.upsert({ competitionId, opensAt: window.opensAt, closesAt: window.closesAt ?? null });
  }

  async getTeam(searchCondition: WhereOptions<Pick<TeamModel, "joinCode" | "teamId">>) : Promise<TeamModel | null> {
    return await TeamModel.findOne({ where:
      (searchCondition)
    });
  }
  /**
   * Puts the team into its new match, but only while its page and both match
   * ids are still the ones `team` holds, so of two starts made from the same
   * reading only one is written. Returns whether the row was written.
   */
  async startMatch(team: TeamModel, gameType: GameType, matchID: string): Promise<boolean> {
    const [updated] = await TeamModel.update({
      pageState: gameType,
      [gameType === "RELAY" ? "relayMatchID" : "strategyMatchID"]: matchID,
    }, {
      where: {
        teamId: team.teamId,
        pageState: team.pageState,
        relayMatchID: team.relayMatchID,
        strategyMatchID: team.strategyMatchID,
      },
    });
    return updated > 0;
  }
  /**
   * Takes the team home, but only while both match ids are still the ones
   * `team` holds: whether a match is in progress is read off the match, not
   * the row, so the caller checks that, and a start landing after it read the
   * team changes an id here. Returns whether the row was written.
   */
  async goHome(team: TeamModel): Promise<boolean> {
    const [updated] = await TeamModel.update({ pageState: "HOME" }, {
      where: { teamId: team.teamId, relayMatchID: team.relayMatchID, strategyMatchID: team.strategyMatchID },
    });
    return updated > 0;
  }

  async insertTeam(
      { teamname, competitionId, category, email, other, startWindow, teamId, joinCode, credentials } :
      { teamname: string, competitionId: string, category: string, email: string, other: string,
        startWindow?: StartWindow, teamId: string, joinCode: string, credentials: string }) {
    return await TeamModel.create({
      teamId, joinCode, other,
      competitionId,
      startOpensAt: startWindow?.opensAt ?? null,
      startClosesAt: startWindow?.closesAt ?? null,
      category,
      email,
      credentials,
      strategyMatchID: null,
      relayMatchID: null,
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
