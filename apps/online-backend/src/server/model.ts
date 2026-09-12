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

  declare pageState: 'DISCLAIMER' | 'HOME' | 'RELAY' | 'STRATEGY';

  declare relayMatch: MatchStatus;
  declare strategyMatch: MatchStatus;

  // Search fields
  declare other: string;

  // timestamps!
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

/** How much the `other` column holds, and all its validator asks of it.
 *
 * The two were 1024 and 700, and the gap was not headroom but a wall: `other`
 * carries the organisers' notes *and* an audit trail the admin routes append to
 * (`server/router.ts`), and sequelize validates a changed attribute on every
 * save. A team imported with notes near 700 characters therefore had its first
 * reset refused — and, since the route's other assignments were in memory only,
 * refused for good, with a message naming a field the organiser had not touched.
 *
 * The import keeps the lower limit of its own below, which is what leaves room
 * for the trail; the column's width is what the column is allowed to hold.
 */
export const OTHER_MAX_LENGTH = 1024;

/** What the team import accepts, which is deliberately less than the column
 * holds: the difference is the room the audit trail grows into.
 *
 * Defined with the rest of the import format's rules in `schemas`, since the
 * admin page enforces the same limit before it uploads, and re-exported here
 * so the column's two limits still read side by side. */
export { OTHER_IMPORT_MAX_LENGTH } from "schemas";

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
        args: [0, 255],
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
        args: [1, 255],
        msg: 'Teamname must be between 1 and 255 characters.'
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
