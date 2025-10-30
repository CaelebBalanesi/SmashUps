import express from 'express';
import {
  createUser,
  getUsers,
  getUserByDiscordId,
  updateUser,
  deleteUser,
  setMain,
} from '../controllers/userController';
import { authenticateJWT } from '../middlewares/auth';

const router = express.Router();

// Public routes
router.post('/', createUser);
router.get('/', getUsers);
router.get('/:discordId', getUserByDiscordId);
router.put('/:discordId', updateUser);

// Authenticated routes
router.delete('/:discordId', authenticateJWT, deleteUser);
router.post('/set-main', authenticateJWT, setMain);

export default router;
