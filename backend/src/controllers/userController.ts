import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user';
import { MatchHistory } from '../models/matchHistory';

export const getUsers = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const allUsers = await User.findAll();
    res.json(allUsers);
  } catch (error) {
    next(error);
  }
};

export const getUserByDiscordId = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { discordId } = req.params;
    const user = await User.findOne({ where: { discordId } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// Requires authenticateJWT — self-only
export const getMatchHistory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { discordId } = req.params;
    if (req.discordId !== discordId)
      return res.status(403).json({ message: 'Cannot view another user\'s history' });

    const history = await MatchHistory.findAll({
      where: { playerDiscordId: discordId },
      order: [['matchedAt', 'DESC']],
    });
    res.json(history);
  } catch (error) {
    next(error);
  }
};

// Requires authenticateJWT — only allows self-update, whitelists `main`
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { discordId } = req.params;
    if (req.discordId !== discordId)
      return res.status(403).json({ message: 'Cannot update another user' });

    const { main } = req.body;
    await req.user!.update({ main });
    res.json(req.user);
  } catch (error) {
    next(error);
  }
};

// Requires authenticateJWT
export const setMain = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { main } = req.body;
    if (!main) return res.status(400).json({ message: 'Missing main value' });

    await req.user!.update({ main });
    res.json(req.user);
  } catch (error) {
    next(error);
  }
};

// Requires authenticateJWT — only allows self-delete
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { discordId } = req.params;
    if (req.discordId !== discordId)
      return res.status(403).json({ message: 'Cannot delete another user' });

    await req.user!.destroy();
    res.json({ message: 'User deleted' });
  } catch (error) {
    next(error);
  }
};
