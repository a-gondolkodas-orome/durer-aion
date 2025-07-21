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

  public pageState!: 'DISCLAIMER'|'HOME'|'RELAY'|'STRATEGY';

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
    unique: {
      name: "teamID",
      msg: 'TeamId already exists.'
    },
    primaryKey: true,
    validate:{
      isUUID: {
        args:4,
        msg: 'TeamId must be a UUIDv4.'
      }
    }
  },
  // metadata
  category: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
    validate:{
      len: {
        args: [0,255],
        msg: 'Email must be between 0 and 255 characters.'
      }
    }
  },
  joinCode: {
    type: DataTypes.STRING,
    unique: {
      name: "joinCode",
      msg: 'JoinCode already exists.'
    },
    validate:{
      is: {
        args: /^[0-9]{3}-[0-9]{4}-[0-9]{3}$/,
        msg: 'JoinCode must be in the format 111-2222-333.'
      }
    }
  },
  teamName: {
    type: DataTypes.STRING,
    unique: {
      name: "teamName",
      msg: 'Teamname already exists.'
    },
    validate:{
      len: {
        args: [1,255],
        msg: 'Teamname must be between 1 and 255 characters.'
      }
    }
  },
  credentials: {
    type: DataTypes.STRING,
    validate:{
      is: {
        args:/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
        msg: 'Credentials must be a valid UUIDv4.'
      }
    }
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
      len: {
        args: [0,700], 
        msg: 'Other field must be between 0 and 700 characters.'
      },
    }
  },
};