import express from 'express'
import { register, login, user } from '../controllers/authController'
import { authenticateToken } from '../middleware/auth'

const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.get('/user', authenticateToken, user)

export default router
