import { DataTypes, Model, ModelAttributes } from "sequelize";

export class RelayProblemModel extends Model {
  public category!: string;
  public index!: number;
  public problemText!: string;
  public answer!: string;
  public points!: number;
  public imageUrls!: string[];
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
  imageUrls: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
  },
};
