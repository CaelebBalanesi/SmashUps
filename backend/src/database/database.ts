import { Sequelize } from 'sequelize';

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DATABASE_PATH ?? 'database.sqlite',
  logging: false,
});
