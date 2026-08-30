import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  ModelAttributes,
} from "sequelize";
import { MatchStatus } from "schemas";

// Sequelize adds the timestamp columns itself, and only for names the attribute
// list leaves free. Omitting them from the attribute types therefore keeps them
// out of the exhaustive column lists below without losing the declared fields.
export interface OmitTimestamps {
  omit: "createdAt" | "updatedAt";
}

export class TeamModel extends Model<
  InferAttributes<TeamModel, OmitTimestamps>,
  InferCreationAttributes<TeamModel, OmitTimestamps>
> {
  declare teamId: string;
  // Important fields
  declare joinCode: string;
  declare teamName: string;
  declare category: string;
  declare credentials: string;
  declare email: string;

  declare pageState: 'DISCLAIMER'|'HOME'|'RELAY'|'STRATEGY';

  declare relayMatch: MatchStatus;
  declare strategyMatch: MatchStatus;

  // Search fields
  declare other: string;

  // timestamps!
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

// Naming the attributes is what makes the column list exhaustive: a field
// declared above with no column here — or a column here that no field
// declares — is a type error.
export const teamAttributes: ModelAttributes<
  TeamModel,
  InferAttributes<TeamModel, OmitTimestamps>
> = {
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
