import { DataTypes, Model, ModelAttributes } from "sequelize";
import { State, LogEntry, Server } from "boardgame.io";

interface NotStartedMatchStatus {
  state: 'NOT STARTED';
}

interface InProgressMatchStatus {
  state: 'IN PROGRESS';
  startAt: Date;
  endAt: Date;
  matchID: string;
}

interface FinishedMatchStatus {
  state: 'FINISHED';
  startAt: Date;
  endAt: Date;
  matchID: string;
  score: number;
}

export type MatchStatus = NotStartedMatchStatus | InProgressMatchStatus | FinishedMatchStatus;

export interface MatchStatusModel {
  state: 'NOT STARTED' | 'IN PROGRESS' | 'FINISHED';
  score?: number;
  startAt?: Date;
  endAt?: Date;
  matchID?: string;
}

export class TeamModel extends Model {
  public id!: string;
  // Important fields
  public joinCode!: string;
  public teamName!: string;
  public credentials!: string;

  public relayMatch!: MatchStatusModel;
  public strategyMatch!: MatchStatusModel;

  // Search fields
  public other!: string;

  // timestamps!
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const teamAttributes: ModelAttributes = {
  id: {
    type: DataTypes.STRING,
    unique: true,
    primaryKey: true,
  },
  // metadata
  joinCode: {
    type: DataTypes.STRING,
  },
  teamName: {
    type: DataTypes.STRING,
  },
  credentials: {
    type: DataTypes.STRING,
  },
  relayMatch: {
    type: DataTypes.JSON,
  },
  strategyMatch: {
    type: DataTypes.JSON,
  },
  other: {
    type: DataTypes.STRING,
  },
};