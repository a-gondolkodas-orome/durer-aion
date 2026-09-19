import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  ModelAttributes,
} from "sequelize";
import { EMAIL_MAX_LENGTH, MatchStatus, OTHER_MAX_LENGTH, TEAMNAME_MAX_LENGTH } from "schemas";

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

  declare pageState: 'DISCLAIMER' | 'HOME' | 'RELAY' | 'STRATEGY';

  declare relayMatch: MatchStatus;
  declare strategyMatch: MatchStatus;

  // Search fields
  declare other: string;

  // timestamps!
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

/** The `other` column's two limits: how much it holds, and the lower length the
 * import keeps so the audit trail this file appends below has room to grow.
 *
 * Both are defined with the rest of the import format's rules in `schemas`,
 * which says what each is for — the admin page enforces them before it uploads,
 * and a limit the page and the column disagreed on would refuse a file only
 * after it reached the server. Re-exported here so they still read side by side
 * with the validator that applies them.
 */
export { OTHER_IMPORT_MAX_LENGTH, OTHER_MAX_LENGTH } from "schemas";

/** A team's notes with one audit note appended, or unchanged when it will not
 * fit.
 *
 * The trail is a convenience and the admin action is the point, so a full field
 * costs the note rather than the reset. Callers pass the field as it came off
 * the row: a team imported from a row with no `Other` column has null there, and
 * `+=` on that used to write the string "null" into the notes.
 */
export function appendOtherNote(other: string | null | undefined, note: string): string {
  const current = other ?? '';
  const appended = current === '' ? note : `${current} ${note}`;
  return appended.length > OTHER_MAX_LENGTH ? current : appended;
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
    validate: {
      isUUID: {
        args: 4,
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
    validate: {
      len: {
        args: [0, EMAIL_MAX_LENGTH],
        msg: `Email must be between 0 and ${EMAIL_MAX_LENGTH} characters.`
      }
    }
  },
  joinCode: {
    type: DataTypes.STRING,
    unique: {
      name: "joinCode",
      msg: 'JoinCode already exists.'
    },
    validate: {
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
    validate: {
      len: {
        args: [1, TEAMNAME_MAX_LENGTH],
        msg: `Teamname must be between 1 and ${TEAMNAME_MAX_LENGTH} characters.`
      }
    }
  },
  credentials: {
    type: DataTypes.STRING,
    validate: {
      is: {
        args: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
        msg: 'Credentials must be a valid UUIDv4.'
      }
    }
  },
  pageState: {
    type: DataTypes.STRING,
  },
  relayMatch: {
    type: DataTypes.JSON,
  },
  strategyMatch: {
    type: DataTypes.JSON,
  },
  other: {
    type: DataTypes.STRING(OTHER_MAX_LENGTH),
    validate: {
      len: {
        args: [0, OTHER_MAX_LENGTH],
        msg: `Other field must be between 0 and ${OTHER_MAX_LENGTH} characters.`
      },
    }
  },
};
