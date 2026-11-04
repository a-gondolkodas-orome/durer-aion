import { PostgresStore } from 'bgio-postgres';
import { env } from 'process';
import { GameType } from 'schemas';
import { teamAttributes, TeamModel } from './model';
import { Sequelize, Op, ValidationError, WhereOptions } from 'sequelize';

/** The fields an import supplies for a team; everything else about a new team
 * is the same for all of them. */
export interface NewTeam {
  teamname: string;
  category: string;
  email: string;
  other: string;
  teamId: string;
  joinCode: string;
  credentials: string;
}

/** The values live teams already hold — one set per unique column — for an
 * importer that has to generate the ones a file left blank and wants to say
 * which row clashes rather than hand back a constraint name. */
export interface TakenIdentifiers {
  teamIds: Set<string>;
  teamNames: Set<string>;
  joinCodes: Set<string>;
  credentials: Set<string>;
}

/** A live team as the import reads it.
 *
 * Whole rows rather than a set per column, because the import has to tell a row
 * that *is* one of these teams from a row that merely clashes with one, and
 * independent sets cannot say which team a value belongs to.
 *
 * `category` and `email` come along so an accepted row can be checked against
 * what is live and the differences named. `other` deliberately does not: the
 * admin routes append an audit trail to it (`appendOtherNote`), so it diverges
 * from the file in the normal course of a competition and reporting that would
 * be noise on every re-import. */
export interface LiveTeam {
  teamId: string;
  teamName: string;
  joinCode: string;
  credentials: string;
  category: string;
  email: string;
}

/** Carries a refused row out of the transaction it has to abort. A managed
 * transaction commits on a normal return, and the whole point here is that one
 * refused row takes the file with it. */
class ImportRejected extends Error {
  constructor(readonly failedRow: number, readonly validation: ValidationError) {
    super(`row ${failedRow} refused`);
  }
}

// Everything a new team starts with beyond what the file supplies: no matches
// played, and the disclaimer still to accept.
function newTeamRow(team: NewTeam) {
  return {
    teamId: team.teamId,
    joinCode: team.joinCode,
    other: team.other,
    category: team.category,
    email: team.email,
    credentials: team.credentials,
    strategyMatchID: null,
    relayMatchID: null,
    teamName: team.teamname,
    pageState: 'DISCLAIMER' as const,
  };
}

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

  async listTeams(): Promise<TeamModel[] | null> {
    return await TeamModel.findAll();
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

  async insertTeam(team: NewTeam) {
    return await TeamModel.create(newTeamRow(team));
  }

  /**
   * The teams an import has to reckon with. Read before one so a generated
   * identifier is checked against them rather than trusted, so a clash is
   * reported against the row that causes it, and so a row naming a team that is
   * already there can be recognised as that team rather than refused.
   *
   * It is not the guard — the unique constraints are, and `insertTeams` rolls
   * the file back on one. This read only buys the readable answer.
   */
  async liveTeams(): Promise<LiveTeam[]> {
    const teams = await TeamModel.findAll({
      attributes: ['teamId', 'teamName', 'joinCode', 'credentials', 'category', 'email'],
    });
    return teams.map(team => ({
      teamId: team.teamId,
      teamName: team.teamName,
      joinCode: team.joinCode,
      credentials: team.credentials,
      category: team.category,
      email: team.email,
    }));
  }

  /**
   * A whole import, in one transaction: every team or none. Returns the row the
   * database refused, or null when they all went in.
   *
   * An import generates the codes it writes, so a half-finished one could not
   * be cleanly retried: the teams that landed would be accepted on the second
   * run rather than written, and their codes would be split across two export
   * files.
   *
   * One transaction is also the fast way to do it. 500 rows under autocommit is
   * 500 commits, each waiting on its own fsync; here it is one.
   */
  async insertTeams(rows: readonly { row: number, team: NewTeam }[]):
    Promise<{ failedRow: number, error: ValidationError } | null> {
    try {
      await this.sequelize.transaction(async transaction => {
        for (const { row, team } of rows) {
          try {
            await TeamModel.create(newTeamRow(team), { transaction });
          } catch (error) {
            if (!(error instanceof ValidationError)) throw error;
            throw new ImportRejected(row, error);
          }
        }
      });
      return null;
    } catch (error) {
      if (error instanceof ImportRejected) return { failedRow: error.failedRow, error: error.validation };
      throw error;
    }
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
