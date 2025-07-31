import { DataTypes, Model, ModelAttributes } from "sequelize";

export class RelayProblemModel extends Model {
  public category!: string;
  public index!: number;
  public problemText!: string;
  public answer!: number | string;
  public points!: number;
  public attachment?: string;
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
    type: DataTypes.STRING,
    allowNull: false,
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  attachment: {
    type: DataTypes.STRING,
    allowNull: true,
  },
};
