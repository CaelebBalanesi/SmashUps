import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../database/database';

export class User extends Model {
  public discordId!: string;
  public username!: string;
  public discriminator!: string;
  public email?: string;
  public avatar?: string;
  public main?: string;
  public dateJoined!: number;
}

User.init(
  {
    discordId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    discriminator: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    main: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    dateJoined: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: () => Date.now(),
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: false,
  },
);

sequelize.sync();
