import { DataTypes, ModelAttributes } from "sequelize";
import { TeamModel, teamAttributes } from "./model";

export class DeletedTeamModel extends TeamModel {
  public deletedAt!: Date;
}
const teamAttributesWithNoUnique = Object.fromEntries(
  Object.entries(teamAttributes).map(([key, value]) => [
    key,
    typeof value === "object" && value !== null
      ? { ...value, unique: false }
      : value,
  ])
);

export const deletedTeamAttributes: ModelAttributes = {
  ...teamAttributesWithNoUnique,
  deletedAt: {
    type: DataTypes.DATE,
    primaryKey: true,
  },
};
