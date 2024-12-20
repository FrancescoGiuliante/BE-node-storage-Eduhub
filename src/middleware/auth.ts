import { Request, Response, NextFunction, RequestHandler } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../config/db'
import { CustomError } from '../app'
import { User } from '@prisma/client'

interface JwtPayload {
    userId: string
}

export const authenticateToken = async (req: Request & { user?: Partial<User> }, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
        res.status(401).json({ error: 'Access token required' })
        return
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
        const user = await prisma.user.findUnique({ where: { id: +decoded.userId } })
        if (!user) {
            const error = new CustomError('Unauthorized: Invalid token.', 401)
            next(error)
            return
        }
        // Qui posso fare ulteriori controlli sull'utente se necessario

        // Aggiungo l'utente autenticato all'oggetto della request per essere riutilizzato dal middleware successivo
        const { password, ...userData } = user;
        req.user = userData;

        next()
    } catch (error) {
        res.status(403).json({ error: 'Invalid token' })
        return
    }
}
