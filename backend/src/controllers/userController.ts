import { Request, Response, NextFunction } from 'express';
import { users, User } from '../models/user';

export const createUser = (req: Request, res: Response, next: NextFunction) => {
  try {
    const discordUser = req.body.discordUser;

    if (!discordUser || !discordUser.id) {
      return res.status(400).json({ message: 'Missing Discord user data' });
    }

    let user = users.find((u) => u.discordId === discordUser.id);

    if (user) {
      Object.assign(user, {
        username: discordUser.username,
        discriminator: discordUser.discriminator,
        email: discordUser.email,
        avatar: discordUser.avatar,
      });
      return res.status(200).json(user);
    }

    const newUser: User = {
      discordId: discordUser.id,
      dateJoined: Date.now(),
      username: discordUser.username,
      discriminator: discordUser.discriminator,
      email: discordUser.email,
      avatar: discordUser.avatar,
    };

    users.push(newUser);
    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
};

export const getUsers = (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const getUserByDiscordId = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { discordId } = req.params;
    const user = users.find((u) => u.discordId === discordId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const updateUser = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { discordId } = req.params;
    const user = users.find((u) => u.discordId === discordId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    Object.assign(user, req.body);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const setMain = (req: Request, res: Response, next: NextFunction) => {
  try {
    const discordId = (req as any).discordId as string;
    console.log('Discord ID from JWT:', discordId);
    console.log('Current users:', users);
    const { main } = req.body;

    if (!discordId) return res.status(401).json({ message: 'Unauthorized' });
    if (!main) return res.status(400).json({ message: 'Missing main' });

    const user = users.find((u) => u.discordId === discordId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.main = main;
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = (req: Request, res: Response, next: NextFunction) => {
  try {
    const discordId = (req as any).discordId as string;
    const { discordId: targetId } = req.params;

    if (!discordId) return res.status(401).json({ message: 'Unauthorized' });
    if (discordId !== targetId)
      return res
        .status(403)
        .json({ message: 'Forbidden: Cannot delete another user' });

    const index = users.findIndex((u) => u.discordId === targetId);
    if (index === -1)
      return res.status(404).json({ message: 'User not found' });

    const deletedUser = users.splice(index, 1)[0];
    res.json(deletedUser);
  } catch (error) {
    next(error);
  }
};
