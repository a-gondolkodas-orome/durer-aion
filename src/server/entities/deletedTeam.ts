import { DataTypes, ModelAttributes } from "sequelize";
import { TeamModel, teamAttributes } from "./model";

export class DeletedTeamModel extends TeamModel {
  public deletedAt!: Date;
}

export const deletedTeamAttributes: ModelAttributes = {
  ...teamAttributes,
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
};
