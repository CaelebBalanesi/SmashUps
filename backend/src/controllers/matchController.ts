import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from '../config/config';
import { Server as HttpServer } from 'http';
import { enterPool, leavePool, OpponentInfo } from '../services/matchmaking';
import {
  registerForReadyCheck,
  markReady,
  cancelReadyCheckForUser,
  READY_TIMEOUT_MS,
} from '../services/readyCheck';
import { MatchHistory } from '../models/matchHistory';

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

  /**
   * Build the onMatch callback for a socket user.
   * Registers with the shared readyCheck service and emits matchPending to the socket.
   */
  function createSocketMatchCallback(socketId: string, searchParams: { main: string; lookingFor: string[] }) {
    return (matchId: string, opponent: OpponentInfo) => {
      const session = userMap.get(socketId);
      if (!session) return;

      registerForReadyCheck(
        matchId,
        session.userId,
        opponent,
        searchParams,
        {
          onConfirmed: () => {
            io.to(socketId).emit('matchConfirmed', { opponent });
            const s = userMap.get(socketId);
            if (s) {
              MatchHistory.create({
                playerDiscordId: s.userId,
                opponentDiscordId: opponent.id,
                opponentUsername: opponent.username,
                opponentAvatar: opponent.avatar ?? null,
                opponentMain: opponent.main,
                playerMain: searchParams.main,
                matchedAt: Date.now(),
              }).catch((err) => console.error('Failed to save match history:', err));
            }
          },
          onDeclined: () => {
            io.to(socketId).emit('matchDeclined', {
              message: 'You did not ready up in time and have been removed from the queue.',
            });
          },
          onRequeue: () => {
            io.to(socketId).emit('requeueing', {
              message: 'Your opponent failed to ready up. Re-entering the queue...',
            });
          },
        },
        () => {
          // Re-enter pool — re-fetch session in case it changed
          const s = userMap.get(socketId);
          if (!s) return;
          enterPool(
            s.userId,
            s.username,
            s.avatar,
            searchParams.main,
            searchParams.lookingFor,
            createSocketMatchCallback(socketId, searchParams),
          );
          io.to(socketId).emit('searching', { message: 'Re-queued — searching for a new opponent...' });
        },
      );

      io.to(socketId).emit('matchPending', { matchId, opponent, timeoutMs: READY_TIMEOUT_MS });
    };
  }

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
      const searchParams = { main, lookingFor };

      const matched = enterPool(
        session.userId,
        session.username,
        session.avatar,
        main,
        lookingFor,
        createSocketMatchCallback(socket.id, searchParams),
      );

      if (!matched) {
        socket.emit('searching', { message: 'Searching for a compatible opponent...' });
      }
    });

    socket.on('readyUp', (data: { matchId: string }) => {
      const session = userMap.get(socket.id);
      if (!session) return;

      const { matchId } = data;
      if (!matchId || typeof matchId !== 'string') return;

      markReady(matchId, session.userId);
      // onConfirmed / callbacks in readyCheck service handle all socket emissions
    });

    socket.on('stopSearch', () => {
      const session = userMap.get(socket.id);
      if (!session) return;
      leavePool(session.userId);
      cancelReadyCheckForUser(session.userId);
      socket.emit('searchStopped');
    });

    socket.on('disconnect', () => {
      const session = userMap.get(socket.id);
      if (session) {
        leavePool(session.userId);
        cancelReadyCheckForUser(session.userId);
        userMap.delete(socket.id);
      }
      console.log('Disconnected:', socket.id);
    });
  });

  console.log('Matchmaking WebSocket initialized');
};
