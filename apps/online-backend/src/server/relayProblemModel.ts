import { DataTypes, Model, ModelAttributes } from "sequelize";

export class RelayProblemModel extends Model {
  public category!: string;
  public index!: number;
  public problemText!: string;
  public answer!: number;
  public points!: number;
  public attachmentUrl?: string;
  public attachmentFileName?: string;
}

export const relayProblemAttributes: ModelAttributes = {
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
  },
  index: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
  },
  problemText: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  answer: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  attachmentUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  attachmentFileName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
};
