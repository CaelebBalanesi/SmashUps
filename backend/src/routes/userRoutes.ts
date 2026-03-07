import { Router } from 'express';
import {
  getUsers,
  getUserByDiscordId,
  updateUser,
  deleteUser,
  setMain,
} from '../controllers/userController';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

// Public routes
router.get('/', getUsers);
router.get('/:discordId', getUserByDiscordId);

// Authenticated routes
router.put('/:discordId', authenticateJWT, updateUser);
router.delete('/:discordId', authenticateJWT, deleteUser);
router.post('/set-main', authenticateJWT, setMain);

export default router;
