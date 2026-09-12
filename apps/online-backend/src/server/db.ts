import { PostgresStore } from 'bgio-postgres';
import { env } from 'process';
import { InProgressMatchStatus } from 'schemas';
import { teamAttributes, TeamModel } from './model';
import { DeletedTeamModel, deletedTeamAttributes } from './deletedTeam';
import { InferAttributes, InferCreationAttributes, Sequelize, Op, Transaction, UniqueConstraintError, ValidationError, WhereOptions } from 'sequelize';
import type { OmitTimestamps } from './model';

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

/** The values live teams already hold, for an importer that has to generate the
 * ones a file left blank and wants to say which row clashes rather than hand
 * back a constraint name. */
export interface TakenIdentifiers {
  teamIds: Set<string>;
  teamNames: Set<string>;
  joinCodes: Set<string>;
}

/** Carries a refused row out of the transaction it has to abort. A managed
 * transaction commits on a normal return, and the whole point here is that one
 * refused row takes the file with it. */
class ImportRejected extends Error {
  constructor(readonly failedRow: number, readonly validation: ValidationError) {
    super(`row ${failedRow} refused`);
  }
}

/** What one deletion moved and one restore moves back: how many teams, and the
 * team names for an answer an organiser can read. */
export interface RestoreResult {
  restored: string[];
  conflicts: string[];
}

// The team's own columns, by name, so a restore copies exactly those off an
// archive row and not the two the archive adds.
const teamColumns = Object.keys(teamAttributes) as (keyof InferAttributes<TeamModel, OmitTimestamps>)[];

// `%` and `_` are wildcards inside a LIKE pattern, so a fragment carrying them
// would match more than the caller asked for — a bare `%` matches every team.
// Backslash is postgres' default LIKE escape character, so no ESCAPE clause is
// needed; it has to escape itself too, or a trailing one would escape the `%`
// that the pattern appends.
export function escapeLike(fragment: string): string {
  return fragment.replace(/[\\%_]/g, character => `\\${character}`);
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
    strategyMatch: { state: "NOT STARTED" } as const,
    relayMatch: { state: "NOT STARTED" } as const,
    teamName: team.teamname,
    pageState: 'DISCLAIMER' as const,
  };
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
  async insertTeam(team: NewTeam) {
    return await TeamModel.create(newTeamRow(team));
  }

  /**
   * The identifiers live teams hold. Read before an import so a generated join
   * code is checked against them rather than trusted, and so a clash is
   * reported against the row that causes it.
   *
   * It is not the guard — the unique constraints are, and `insertTeams` rolls
   * the file back on one. This read only buys the readable answer.
   */
  async takenIdentifiers(): Promise<TakenIdentifiers> {
    const teams = await TeamModel.findAll({ attributes: ['teamId', 'teamName', 'joinCode'] });
    return {
      teamIds: new Set(teams.map(team => team.teamId)),
      teamNames: new Set(teams.map(team => team.teamName)),
      joinCodes: new Set(teams.map(team => team.joinCode)),
    };
  }

  /**
   * A whole import, in one transaction: every team or none. Returns the row the
   * database refused, or null when they all went in.
   *
   * All-or-nothing, unlike `restoreBatch` next door, which deliberately gives
   * each row its own transaction. The difference is that a restore invents
   * nothing — the archived rows carry their own join codes, so re-running one
   * is idempotent. An import generates the codes it writes, so a half-finished
   * one cannot be retried: the teams that landed would clash with themselves on
   * the second run, and their codes would be split across two export files.
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

  /**
   * Every team into the archive under one `deletedAt`, then all of them
   * dropped, in one transaction. The shared timestamp is what makes the rows a
   * batch: the archive has no column for one, and `sequelize.sync()` would not
   * add it to an existing table (DEPLOYMENT.md), so the timestamp is what a
   * caller names the batch by when restoring it.
   */
  async removeAllTeams(): Promise<{ deleted: number, deletedAt: Date }> {
    return await this.sequelize.transaction(async transaction => {
      const teams = await TeamModel.findAll({ transaction, lock: Transaction.LOCK.UPDATE });
      const deletedAt = new Date();
      await DeletedTeamModel.bulkCreate(
        teams.map(team => ({ ...team.toJSON(), deletedAt })),
        { transaction },
      );
      const deleted = await TeamModel.destroy({ where: { teamId: teams.map(team => team.teamId) }, transaction });
      return { deleted, deletedAt };
    });
  }

  /** The archive, newest deletion first; within a batch, in deletion order. */
  async listDeletedTeams(): Promise<DeletedTeamModel[]> {
    return await DeletedTeamModel.findAll({ order: [['deletedAt', 'DESC'], ['deletionId', 'ASC']] });
  }

  /**
   * The archived row back into `Teams` with everything it had — page state and
   * both matches included, so a team deleted mid-round resumes where it was —
   * and out of the archive, in one transaction. `null` for a `deletionId` the
   * archive does not have.
   *
   * A live team holding the same id, join code or name fails the insert on its
   * unique constraint, and sequelize's `UniqueConstraintError` propagates: the
   * transaction rolls back and the archive keeps its row. There is no check
   * ahead of the insert, because the constraint is the check and cannot race.
   */
  async restoreTeam(deletionId: number): Promise<TeamModel | null> {
    return await this.sequelize.transaction(async transaction => {
      const archived = await DeletedTeamModel.findOne({ where: { deletionId }, transaction, lock: Transaction.LOCK.UPDATE });
      if (!archived) return null;
      const values = archived.toJSON();
      const team = Object.fromEntries(
        teamColumns.map(column => [column, values[column]]),
      ) as InferCreationAttributes<TeamModel, OmitTimestamps>;
      const restored = await TeamModel.create(team, { transaction });
      await DeletedTeamModel.destroy({ where: { deletionId }, transaction });
      return restored;
    });
  }

  /**
   * A batch — the rows sharing a `deletedAt` — restored row by row, each in its
   * own transaction, so a team that clashes with a live one is reported and the
   * rest still come back. A row someone else restored meanwhile is in neither
   * list.
   */
  async restoreBatch(deletedAt: Date): Promise<RestoreResult> {
    const rows = await DeletedTeamModel.findAll({ where: { deletedAt }, order: [['deletionId', 'ASC']] });
    const result: RestoreResult = { restored: [], conflicts: [] };
    for (const row of rows) {
      try {
        if (await this.restoreTeam(row.deletionId)) result.restored.push(row.teamName);
      } catch (error) {
        if (!(error instanceof UniqueConstraintError)) throw error;
        result.conflicts.push(row.teamName);
      }
    }
    return result;
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
