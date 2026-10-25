import { PostgresStore } from 'bgio-postgres';
import { env } from 'process';
import { CompetitionCategory } from 'schemas';
import { appendOtherNote, teamAttributes, TeamModel } from './model';
import { Sequelize, Op, Transaction, WhereOptions } from 'sequelize';

/** The fields an organiser may correct on a team, each optional. */
export interface TeamEdit {
  teamName?: string;
  category?: CompetitionCategory;
}

/** Why an edit was refused, when it was. */
export type TeamEditRefusal = 'not-found' | 'started' | 'notes-full';

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
  async insertTeam(
      { teamname, category, email, other, teamId, joinCode, credentials } :
      { teamname: string, category: string, email: string, other: string, teamId: string, joinCode: string, credentials: string }) {
    return await TeamModel.create({
      teamId, joinCode, other,
      category,
      email,
      credentials,
      strategyMatchID: null,
      relayMatchID: null,
      teamName: teamname,
      pageState: 'DISCLAIMER',
    });
  }

  /**
   * Corrects a team's name or category, while neither of its matches has
   * started: a match is created for the team's category, so a team that has one
   * keeps the category it was played in. A reset clears the match's id, so a
   * team whose matches were both reset counts as not started.
   *
   * Every changed field leaves its old value in `other` — `prevname:` with the
   * name JSON-quoted, since names hold spaces, and `prevcat:` — and an edit
   * whose notes would not fit is refused rather than made without them.
   *
   * The row is locked while it is checked and written, so a reset or another
   * edit cannot land in between. A name another team holds fails the write on
   * its unique constraint, and sequelize's `UniqueConstraintError` propagates.
   */
  async editTeam(teamId: string, edit: TeamEdit): Promise<TeamModel | TeamEditRefusal> {
    return await this.sequelize.transaction(async transaction => {
      const team = await TeamModel.findOne({ where: { teamId }, transaction, lock: Transaction.LOCK.UPDATE });
      if (!team) return 'not-found';
      if (team.relayMatchID !== null || team.strategyMatchID !== null) return 'started';

      const notes: string[] = [];
      if (edit.teamName !== undefined && edit.teamName !== team.teamName) {
        notes.push(`prevname:${JSON.stringify(team.teamName)}`);
        team.teamName = edit.teamName;
      }
      if (edit.category !== undefined && edit.category !== team.category) {
        notes.push(`prevcat:${team.category}`);
        team.category = edit.category;
      }
      if (notes.length === 0) return team;

      const other = appendOtherNote(team.other, notes.join(' '));
      if (other === (team.other ?? '')) return 'notes-full';
      team.other = other;
      return await team.save({ transaction });
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
