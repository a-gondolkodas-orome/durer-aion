import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  ModelAttributes,
} from "sequelize";
import { TeamModel, teamAttributes, OmitTimestamps } from "./model";

export class DeletedTeamModel extends TeamModel {
  declare deletedAt: Date;
  declare deletionId: CreationOptional<number>;

  // Sequelize reads a model's attribute and creation-attribute types off these
  // two members. The ones inherited from TeamModel still describe TeamModel, so
  // without redeclaring them the archive's own columns stay invisible to
  // `init` and `create`.
  declare _attributes: InferAttributes<DeletedTeamModel, OmitTimestamps>;
  declare _creationAttributes: InferCreationAttributes<DeletedTeamModel, OmitTimestamps>;
}

// The archive keeps a row per deletion, so a team deleted twice would collide
// with itself on every column the live table declares unique.
function withoutUniqueness<M extends Model, TAttributes>(
  attributes: ModelAttributes<M, TAttributes>
): ModelAttributes<M, TAttributes> {
  return Object.fromEntries(
    Object.entries(attributes).map(([name, column]) => [
      name,
      typeof column === "object" && column !== null
        ? { ...column, unique: false }
        : column,
    ])
  ) as ModelAttributes<M, TAttributes>;
}

export const deletedTeamAttributes: ModelAttributes<
  DeletedTeamModel,
  InferAttributes<DeletedTeamModel, OmitTimestamps>
> = {
  ...withoutUniqueness(teamAttributes),
  deletedAt: {
    type: DataTypes.DATE,
    primaryKey: true,
  },
  deletionId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  }
};
