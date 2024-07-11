import { DataTypes, Model, ModelAttributes } from "sequelize";

export interface NotStartedMatchStatus {
  state: 'NOT STARTED';
}

export interface InProgressMatchStatus {
  state: 'IN PROGRESS';
  startAt: Date;
  endAt: Date;
  matchID: string;
}

export interface FinishedMatchStatus {
  state: 'FINISHED';
  startAt: Date;
  endAt: Date;
  matchID: string;
  score: number;
}

export type MatchStatus = NotStartedMatchStatus | InProgressMatchStatus | FinishedMatchStatus;

export class TeamModel extends Model {
  public teamId!: string;
  // Important fields
  public joinCode!: string;
  public teamName!: string;
  public category!: string;
  public credentials!: string;
  public email!: string;

  public pageState!: 'DISCLAIMER'|'HOME'|'RELAY'|'STRATEGY'

  public relayMatch!: MatchStatus;
  public strategyMatch!: MatchStatus;

  // Search fields
  public other!: string;

  // timestamps!
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const teamAttributes: ModelAttributes = {
  teamId: {
    type: DataTypes.STRING,
    unique: true,
    primaryKey: true,
    validate:{
      isUUID:4
    }
  },
  // metadata
  category: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
    validate:{
      len: [0,255]
    }
  },
  joinCode: {
    type: DataTypes.STRING,
  },
  teamName: {
    type: DataTypes.STRING,
    unique: true,
    validate:{
      len: [1,255]
    }
  },
  credentials: {
    type: DataTypes.STRING,
  },
  pageState:{
    type: DataTypes.STRING,
  },
  relayMatch: {
    type: DataTypes.JSON,
  },
  strategyMatch: {
    type: DataTypes.JSON,
  },
  other: {
    type: DataTypes.STRING(1024),
    validate:{
      len: [0,700]
    }
  },
};