import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user';

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const discordUser = req.body.discordUser;

    if (!discordUser || !discordUser.id) {
      return res.status(400).json({ message: 'Missing Discord user data' });
    }

    let user = await User.findOne({ where: { discordId: discordUser.id } });

    if (user) {
      await user.update({
        username: discordUser.username,
        discriminator: discordUser.discriminator,
        email: discordUser.email,
        avatar: discordUser.avatar,
      });
      return res.status(200).json(user);
    }

    const newUser = await User.create({
      discordId: discordUser.id,
      username: discordUser.username,
      discriminator: discordUser.discriminator,
      email: discordUser.email,
      avatar: discordUser.avatar,
    });

    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (
  req: Request,
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

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { discordId } = req.params;
    const user = await User.findOne({ where: { discordId } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.update(req.body);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const setMain = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const discordId = (req as any).discordId as string;
    const { main } = req.body;

    if (!discordId) return res.status(401).json({ message: 'Unauthorized' });
    if (!main) return res.status(400).json({ message: 'Missing main value' });

    const user = await User.findOne({ where: { discordId } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.update({ main });

    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const discordId = (req as any).discordId as string;
    const { discordId: targetId } = req.params;

    if (!discordId) return res.status(401).json({ message: 'Unauthorized' });
    if (discordId !== targetId)
      return res.status(403).json({ message: 'Cannot delete another user' });

    const user = await User.findOne({ where: { discordId: targetId } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.destroy();
    res.json(user);
  } catch (error) {
    next(error);
  }
};
