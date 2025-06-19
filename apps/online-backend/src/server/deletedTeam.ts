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
    primaryKey: true,
  },
  teamId: {
    type: DataTypes.STRING,
    unique: {
      name: "teamID",
      msg: 'TeamId already exists.'
    },
    validate:{
      isUUID: {
        args:4,
        msg: 'TeamId must be a UUIDv4.'
      }
    },
    primaryKey: true,
  },
};
