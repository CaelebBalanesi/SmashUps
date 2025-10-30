import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/config';
import { User } from '../models/user';

interface JwtPayload {
  id: string; // discordId
  username: string;
  avatar?: string;
  email?: string;
  iat: number;
  exp: number;
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
    if (!decoded || !decoded.id)
      return res.status(401).json({ error: 'Invalid token' });

    // Fetch the user from the database
    const user = await User.findOne({ where: { discordId: decoded.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    (req as any).user = user;
    (req as any).discordId = user.discordId;

    next();
  } catch (error) {
    console.error('JWT Authentication error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};
