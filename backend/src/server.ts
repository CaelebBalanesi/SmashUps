import http from 'http';
import app from './app';
import config from './config/config';
import { initMatchSocket } from './controllers/matchController';

const server = http.createServer(app);

initMatchSocket(server);

server.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
