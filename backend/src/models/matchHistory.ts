import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../database/database';

export class MatchHistory extends Model {
  public id!: number;
  public playerDiscordId!: string;
  public opponentDiscordId!: string;
  public opponentUsername!: string;
  public opponentAvatar!: string | null;
  public opponentMain!: string;
  public playerMain!: string;
  public matchedAt!: number;
}

MatchHistory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    playerDiscordId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    opponentDiscordId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    opponentUsername: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    opponentAvatar: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    opponentMain: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    playerMain: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    matchedAt: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: () => Date.now(),
    },
  },
  {
    sequelize,
    tableName: 'match_history',
    timestamps: false,
  },
);
