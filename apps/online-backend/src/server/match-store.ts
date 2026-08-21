import type { PostgresStore } from 'bgio-postgres';
import { DataTypes, Model, ModelAttributes, Op, Sequelize } from 'sequelize';

// The v2 match tables (PR 3.1 of docs/boardgame-io-replacement-plan.md):
// a snapshot row per match and an append-only event log under it. Both are
// additive on the shared sequelize instance — initialized here, created by the
// same `sync()` that creates Teams — and the bgio Games table coexists
// untouched: which table holds a matchID is what the `engine` field on the
// team's match status dispatches.

export type MatchKind = 'STRATEGY' | 'RELAY';
// Who caused an event. MOVE payloads carry their own team/bot attribution for
// applyEvent; the column exists so every event of the log — an admin's
// ADD_MINUTES, a stale-match CLOSE — is attributable without parsing payloads.
export type MatchEventActor = 'team' | 'bot' | 'admin' | 'system';

export class MatchModel extends Model {
  public matchId!: string;
  public teamId!: string;
  public kind!: MatchKind;
  public gameId!: string;
  // CompetitionMatchState for STRATEGY; the relay state machine (Phase 6)
  // stores its own shape here. Always equal to the fold of this match's
  // events — match-store.test.ts pins that discipline.
  public state!: unknown;
  public version!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const matchAttributes: ModelAttributes = {
  matchId: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  teamId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  kind: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  gameId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  state: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
  version: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
};

export class MatchEventModel extends Model {
  public matchId!: string;
  public seq!: number;
  public actor!: MatchEventActor;
  public type!: string;
  // The whole event, self-contained: replaying a match reads payloads alone.
  public payload!: unknown;
  public readonly createdAt!: Date;
}

export const matchEventAttributes: ModelAttributes = {
  matchId: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  seq: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  actor: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  payload: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
};

export interface AppendableEvent {
  actor: MatchEventActor;
  type: string;
  payload: unknown;
}

export class MatchesRepository {
  sequelize: Sequelize;

  constructor(db: PostgresStore) {
    this.sequelize = db.sequelize;
    MatchModel.init(matchAttributes, {
      sequelize: db.sequelize,
      tableName: 'Matches',
    });
    MatchEventModel.init(matchEventAttributes, {
      sequelize: db.sequelize,
      tableName: 'MatchEvents',
      // Append-only: a row is written once, so there is nothing to update.
      updatedAt: false,
    });
  }

  async createMatch({ matchId, teamId, kind, gameId, state }: {
    matchId: string; teamId: string; kind: MatchKind; gameId: string; state: unknown;
  }): Promise<void> {
    await MatchModel.create({ matchId, teamId, kind, gameId, state, version: 0 });
  }

  async getMatch(matchId: string): Promise<MatchModel | null> {
    return await MatchModel.findOne({ where: { matchId } });
  }

  // One write per accepted request: the events it produced and the state they
  // fold to, in one transaction. `knownVersion` is the version the caller read
  // `state` at — optimistic concurrency, so a concurrent tab's write cannot be
  // silently lost: whoever comes second sees `conflict` (a 409 upstream) and
  // re-fetches. The version guard is also what makes the seq numbering safe:
  // two writers cannot both pass it, so max(seq) cannot race.
  async appendEvents({ matchId, knownVersion, events, state }: {
    matchId: string; knownVersion: number; events: AppendableEvent[]; state: unknown;
  }): Promise<{ ok: true; version: number } | { ok: false; conflict: true }> {
    return await this.sequelize.transaction(async (transaction) => {
      const [updatedRows] = await MatchModel.update(
        { state, version: knownVersion + 1 },
        { where: { matchId, version: knownVersion }, transaction }
      );
      if (updatedRows === 0) return { ok: false as const, conflict: true as const };
      const maxSeq = (await MatchEventModel.max<number, MatchEventModel>(
        'seq', { where: { matchId }, transaction }
      )) ?? -1;
      await MatchEventModel.bulkCreate(
        events.map((event, i) => ({ matchId, seq: maxSeq + 1 + i, ...event })),
        { transaction }
      );
      return { ok: true as const, version: knownVersion + 1 };
    });
  }

  // The polling GET's `?since=<seq>`: everything after what the client already
  // has, in play order.
  async eventsSince(matchId: string, sinceSeq: number): Promise<MatchEventModel[]> {
    return await MatchEventModel.findAll({
      where: { matchId, seq: { [Op.gt]: sinceSeq } },
      order: [['seq', 'ASC']],
    });
  }
}
