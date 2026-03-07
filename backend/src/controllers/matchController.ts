import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from '../config/config';
import { Server as HttpServer } from 'http';
import { enterPool, leavePool } from '../services/matchmaking';

interface UserSession {
  userId: string;
  username: string;
  avatar?: string;
  main?: string;
  socketId: string;
}

const userMap = new Map<string, UserSession>();

export const initMatchSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: config.frontendUrl,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('authenticate', (token: string) => {
      try {
        const decoded = jwt.verify(token, config.jwtSecret) as {
          id: string;
          username: string;
          avatar?: string;
          main?: string;
        };
        const { id, username, avatar, main } = decoded;

        const session: UserSession = { userId: id, username, avatar, main, socketId: socket.id };
        userMap.set(socket.id, session);
        socket.data.userId = id;

        console.log(`Authenticated: ${username} (${id})`);
        socket.emit('authenticated', { success: true, user: session });
      } catch {
        console.warn('Authentication failed for socket', socket.id);
        socket.emit('authenticated', { success: false });
      }
    });

    socket.on('startSearch', (data: { main: string; lookingFor: string[] }) => {
      const session = userMap.get(socket.id);
      if (!session) return socket.emit('error', 'You must authenticate first.');

      const { main, lookingFor } = data;
      if (!main || !Array.isArray(lookingFor)) return socket.emit('error', 'Invalid search data.');

      session.main = main;

      const matched = enterPool(
        session.userId,
        session.username,
        session.avatar,
        main,
        lookingFor,
        (opponent) => socket.emit('matchFound', { opponent }),
      );

      if (!matched) {
        socket.emit('searching', { message: 'Searching for a compatible opponent...' });
      }
    });

    socket.on('stopSearch', () => {
      const session = userMap.get(socket.id);
      if (!session) return;
      leavePool(session.userId);
      socket.emit('searchStopped');
    });

    socket.on('disconnect', () => {
      const session = userMap.get(socket.id);
      if (session) {
        leavePool(session.userId);
        userMap.delete(socket.id);
      }
      console.log('Disconnected:', socket.id);
    });
  });

  console.log('Matchmaking WebSocket initialized');
};
