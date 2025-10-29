import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  discordClientID: string;
  discordClientSecret: string;
  redirectURI: string;
  frontendUrl: string;
  backendURL: string;
  jwtSecret: string;
}

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  discordClientID: process.env.DISCORD_CLIENT_ID || '',
  discordClientSecret: process.env.DISCORD_CLIENT_SECRET || '',
  redirectURI: process.env.REDIRECT_URI || '',
  frontendUrl: process.env.FRONTEND_URL || '',
  backendURL: process.env.BACKEND_URL || '',
  jwtSecret: process.env.JWT_SECRET || '',
};

export default config;
