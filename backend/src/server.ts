import http from 'http';
import app from './app';
import config from './config/config';
import { initMatchSocket } from './controllers/matchController';
import { sequelize } from './database/database';
import { initBot } from './bot/index';

const server = http.createServer(app);

initMatchSocket(server);

sequelize.sync().then(() => {
  server.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
});

initBot().catch((err) => console.error('Bot failed to initialize:', err));
