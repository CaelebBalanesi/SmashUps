import express from 'express';
import {
  createUser,
  getUsers,
  getUserByDiscordId,
  updateUser,
  deleteUser,
  setMain,
} from '../controllers/userController';
import { requireUserId } from '../middlewares/requireUser';

const router = express.Router();

// Public routes
router.post('/', createUser);
router.get('/', getUsers);
router.get('/:discordId', getUserByDiscordId);
router.put('/:discordId', updateUser);

// Authenticated routes
router.delete('/:discordId', requireUserId, deleteUser);
router.post('/set-main', requireUserId, setMain);

export default router;
