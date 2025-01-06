import express from 'express';
import { register, login, user, updateAvatar, users, userDelete, updateUserRole, updateUser } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/user', authenticateToken, user);
router.put('/user/:id', authenticateToken, updateUser);

router.delete('/user/:id', authenticateToken, userDelete);
router.put('/user-updateRole/:id', authenticateToken, updateUserRole);


router.get('/users', authenticateToken, users);

router.put('/user/avatar', authenticateToken, updateAvatar);

export default router;
