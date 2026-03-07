import dotenv from 'dotenv';

dotenv.config();

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

interface Config {
  port: number;
  nodeEnv: string;
  discordClientID: string;
  discordClientSecret: string;
  redirectURI: string;
  frontendUrl: string;
  backendURL: string;
  jwtSecret: string;
  discordBotToken?: string;
  discordGuildId?: string;
}

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  discordClientID: required('DISCORD_CLIENT_ID'),
  discordClientSecret: required('DISCORD_CLIENT_SECRET'),
  redirectURI: required('REDIRECT_URI'),
  frontendUrl: required('FRONTEND_URL'),
  backendURL: process.env.BACKEND_URL || '',
  jwtSecret: required('JWT_SECRET'),
  discordBotToken: process.env.DISCORD_BOT_TOKEN,
  discordGuildId: process.env.DISCORD_GUILD_ID,
};

export default config;
