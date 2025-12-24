import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from '../config/config';
import { Server as HttpServer } from 'http';

interface UserSession {
  userId: string;
  username: string;
  avatar?: string;
  main?: string;
  socketId: string;
}

interface SearchEntry {
  userId: string;
  main: string;
  lookingFor: string[];
  socketId: string;
}

const userMap = new Map<string, UserSession>();
const searchPool: SearchEntry[] = [];

const findMutualMatch = (entry: SearchEntry): SearchEntry | null => {
  return (
    searchPool.find(
      (other) =>
        other.userId !== entry.userId &&
        other.lookingFor.includes(entry.main) &&
        entry.lookingFor.includes(other.main),
    ) || null
  );
};

export const initMatchSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: config.frontendUrl,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // ---- Authenticate ----
    socket.on('authenticate', (token: string) => {
      try {
        const decoded = jwt.verify(token, config.jwtSecret) as any;
        const { id, username, avatar, main } = decoded;

        const session: UserSession = {
          userId: id,
          username,
          avatar,
          main,
          socketId: socket.id,
        };

        userMap.set(socket.id, session);
        socket.data.userId = id;

        console.log(`Authenticated: ${username} (${id})`);
        socket.emit('authenticated', { success: true, user: session });
      } catch (err) {
        console.warn('Authentication failed for socket', socket.id);
        socket.emit('authenticated', { success: false });
      }
    });

    // ---- Start Match Search ----
    socket.on('startSearch', (data: { main: string; lookingFor: string[] }) => {
      const userSession = userMap.get(socket.id);
      if (!userSession)
        return socket.emit('error', 'You must authenticate first.');

      const { main, lookingFor } = data;
      if (!main || !Array.isArray(lookingFor))
        return socket.emit('error', 'Invalid search data.');

      // Update user's main if changed
      userSession.main = main;

      // Remove old search if exists
      const existing = searchPool.findIndex(
        (s) => s.userId === userSession.userId,
      );
      if (existing !== -1) searchPool.splice(existing, 1);

      const entry: SearchEntry = {
        userId: userSession.userId,
        main,
        lookingFor,
        socketId: socket.id,
      };

      // Try to find a match
      const match = findMutualMatch(entry);
      if (match) {
        const opponentSession = [...userMap.values()].find(
          (u) => u.userId === match.userId,
        );

        if (!opponentSession)
          return socket.emit('error', 'Opponent session not found.');

        const opponentSocket = io.sockets.sockets.get(opponentSession.socketId);
        if (opponentSocket) {
          opponentSocket.emit('matchFound', {
            opponent: {
              id: userSession.userId,
              username: userSession.username,
              avatar: userSession.avatar,
              main: userSession.main,
            },
          });
        }

        socket.emit('matchFound', {
          opponent: {
            id: opponentSession.userId,
            username: opponentSession.username,
            avatar: opponentSession.avatar,
            main: opponentSession.main,
          },
        });

        // Remove both from search pool
        searchPool.splice(searchPool.indexOf(match), 1);
      } else {
        searchPool.push(entry);
        socket.emit('searching', {
          message: 'Searching for a compatible opponent...',
        });
      }
    });

    // ---- Stop Searching ----
    socket.on('stopSearch', () => {
      const userSession = userMap.get(socket.id);
      if (!userSession) return;
      const index = searchPool.findIndex(
        (s) => s.userId === userSession.userId,
      );
      if (index !== -1) searchPool.splice(index, 1);
      socket.emit('searchStopped');
    });

    // ---- Handle Disconnect ----
    socket.on('disconnect', () => {
      const userSession = userMap.get(socket.id);
      if (userSession) {
        const index = searchPool.findIndex(
          (s) => s.userId === userSession.userId,
        );
        if (index !== -1) searchPool.splice(index, 1);
        userMap.delete(socket.id);
      }
      console.log('Disconnected:', socket.id);
    });
  });

  console.log('Matchmaking WebSocket initialized');
};
