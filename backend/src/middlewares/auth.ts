import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/config';
import { User } from '../models/user';

interface JwtPayload {
  id: string;
  username: string;
  avatar?: string;
  email?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
      discordId?: string;
    }
  }
}

export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Missing token' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Invalid token format' });

    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

    const user = await User.findOne({ where: { discordId: decoded.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    req.user = user;
    req.discordId = user.discordId;

    next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};
